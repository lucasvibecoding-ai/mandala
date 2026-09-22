// e-računi (e-racuni.com) fiscalization client.
//
// One e-računi organization issues fiscalized invoices for all brands. Fiscalization
// (JIR / ZKI / QR) is automatic on e-računi's side once the org is configured with the
// FINA certificate + registered business premises, so this module only has to create the
// invoice and hand back the public view/download URL that we drop into the buyer's email.
//
// The API is JSON-RPC style: POST { username, secretKey, token, method, parameters } to the
// org-specific endpoint. `apiTransactionId` makes SalesInvoiceCreate idempotent, so retrying
// with the same payment id NEVER creates a duplicate invoice.

import { vatTreatment } from './vat-country';

export type FiscalInvoiceInput = {
  apiTransactionId: string; // Stripe PaymentIntent id or PayPal order id (idempotency key)
  buyerName?: string;
  buyerEmail?: string;
  description: string; // course name shown on the invoice line
  amount: number; // total the buyer actually paid
  currency: string; // e.g. 'EUR'
  methodOfPayment: 'Stripe' | 'PayPal';
  includeAddon?: boolean; // buyer added the order bump -> append the addon product line
  buyerCountry?: string | null; // ISO-2, decides the vrsta prodaje (see lib/vat-country.ts)
};

export type FiscalInvoiceResult = { publicUrl: string; documentId?: string };

// e-računi field names for the cross-border VAT fields, from the SalesInvoice / SalesQuote
// API docs (e-racuni.com/Croatian/p-1001761 and WS+API+SalesQuote). `vatTransactionType` on a
// line item is confirmed by the official example ("vatTransactionType": "16"); the rest are
// documented on the quote object, which shares the document fields, and are re-checked by the
// probe. This block is the only place that has to change if a spelling turns out wrong.
const FIELD = {
  buyerCountry: 'buyerCountry', // ISO-2
  vatTransactionType: 'vatTransactionType', // vrsta prodaje, document AND item level
  remarks: 'remarks', // free text printed on the document
  vatCountryIsoCode: 'vatCountryIsoCode', // country whose VAT rate applies (OSS)
} as const;

// Error that records whether the failure is permanent (bad payload / validation -> retrying
// won't help) or transient (network / 5xx -> worth retrying within the deadline).
class ERacuniError extends Error {
  readonly permanent: boolean;
  constructor(message: string, permanent: boolean) {
    super(message);
    this.name = 'ERacuniError';
    this.permanent = permanent;
  }
}

function config() {
  const endpoint = process.env.E_RACUNI_ENDPOINT;
  const username = process.env.E_RACUNI_USERNAME;
  const secretKey = process.env.E_RACUNI_SECRET_KEY;
  const token = process.env.E_RACUNI_TOKEN;
  if (!endpoint || !username || !secretKey || !token) return null;
  return { endpoint, username, secretKey, token };
}

function buildSalesInvoice(input: FiscalInvoiceInput) {
  // type "Retail" = consumer receipt: the price is the FINAL tax-inclusive amount the buyer
  // paid, and VAT is carved out of it rather than added on top. dateOfSupplyFrom
  // (YYYY-MM-DD) is required. businessUnit = fiscalized poslovni prostor (optional env).
  // documentLanguage must be a full language NAME: Slovene, English, German or Croatian (NOT an
  // ISO code like "en"). Map common ISO codes so E_RACUNI_LANGUAGE=en still works; default to
  // English; empty string -> omit (use the org default language).
  const dateOfSupplyFrom = new Date().toISOString().slice(0, 10);
  const businessUnit = process.env.E_RACUNI_BUSINESS_UNIT;
  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    hr: 'Croatian',
    de: 'German',
    sl: 'Slovene',
    si: 'Slovene',
  };
  const rawLanguage = process.env.E_RACUNI_LANGUAGE ?? 'English';
  const documentLanguage = LANGUAGE_NAMES[rawLanguage.toLowerCase()] ?? rawLanguage;
  const productCode = process.env.E_RACUNI_PRODUCT_CODE;
  const addonProductCode = process.env.E_RACUNI_ADDON_PRODUCT_CODE;

  // Buyer country -> vrsta prodaje + rate. Before VAT_START this yields vrsta null and the
  // payload stays exactly as it was, so a deploy can land before the e-računi org is flipped.
  const treatment = vatTreatment(input.buyerCountry);

  // With a product code set, reference the defined artikl so the sale corresponds to it —
  // e-računi supplies its price, unit, VAT and name. If the buyer added the order bump, append
  // the addon artikl as its own line. Without a product code we fall back to a single ad-hoc
  // line (description + the exact paid amount, bump included).
  // The vrsta prodaje rides on every line as well as on the document: the API docs set it per
  // item ("vatTransactionType": "16" in their reverse-charge example), and e-računi's own help
  // says a document-level value only reaches the lines with "prijenos vrste prodaje na stavke".
  const lineVat = treatment.vrsta !== null ? { vatTransactionType: String(treatment.vrsta) } : {};

  const items = productCode
    ? [
        { productCode, quantity: 1, ...lineVat },
        ...(input.includeAddon && addonProductCode
          ? [{ productCode: addonProductCode, quantity: 1, ...lineVat }]
          : []),
      ]
    : [
        {
          description: input.description,
          quantity: 1,
          // type "Retail" means `price` is the final price INCLUDING all taxes, so the buyer
          // still pays exactly 47 and e-računi carves the VAT out of it (`netPrice` would be
          // the other way round and would add tax on top).
          price: input.amount,
          unit: 'kom',
          vatPercentage: treatment.rate,
          ...lineVat,
        },
      ];

  // Vrsta prodaje + buyer country on the document, transferred down to the lines. Non-EU
  // documents also carry the legal clause explaining why no VAT is charged.
  const crossBorder =
    treatment.vrsta !== null
      ? {
          [FIELD.buyerCountry]: treatment.country,
          [FIELD.vatTransactionType]: String(treatment.vrsta),
          // Only for OSS documents: the member state whose rate is charged.
          ...(treatment.vrsta === 100 ? { [FIELD.vatCountryIsoCode]: treatment.country } : {}),
          ...(treatment.note ? { [FIELD.remarks]: treatment.note } : {}),
        }
      : {};

  return {
    dateOfSupplyFrom,
    buyerName: input.buyerName || 'Kupac',
    buyerEMail: input.buyerEmail,
    type: 'Retail',
    methodOfPayment: input.methodOfPayment,
    currency: input.currency,
    totalCurrency: input.currency,
    ...(documentLanguage ? { documentLanguage } : {}),
    ...(businessUnit ? { businessUnit } : {}),
    ...crossBorder,
    Items: items,
  };
}

async function callOnce(
  cfg: NonNullable<ReturnType<typeof config>>,
  input: FiscalInvoiceInput,
): Promise<FiscalInvoiceResult> {
  let res: Response;
  try {
    res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cfg.username,
        secretKey: cfg.secretKey,
        token: cfg.token,
        method: 'SalesInvoiceCreate',
        parameters: {
          apiTransactionId: input.apiTransactionId,
          SalesInvoice: buildSalesInvoice(input),
          generatePublicURL: true,
          sendIssuedInvoiceByEmail: false,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    // Network error / timeout -> transient, worth retrying.
    throw new ERacuniError(`request failed: ${err instanceof Error ? err.message : String(err)}`, false);
  }

  const raw = await res.text();
  let data: Record<string, any>;
  try {
    data = JSON.parse(raw);
  } catch {
    // 5xx (incl. a non-JSON proxy/gateway error page) = transient, retry within the deadline;
    // 4xx / other = permanent (bad request / auth), no point retrying.
    throw new ERacuniError(`non-JSON response (${res.status}): ${raw.slice(0, 300)}`, res.status < 500);
  }

  // Log the raw response so we can confirm the exact success shape / URL field name.
  console.log('[eracuni] SalesInvoiceCreate response:', JSON.stringify(data).slice(0, 1000));

  // e-računi wraps the payload in a "response" object carrying a status; the created document
  // (documentID, number, documentURL) lives under response.result.
  const r = (data.response ?? data) as Record<string, any>;

  if (r?.status === 'error') {
    // Validation / business error: our payload is wrong. Do NOT retry — it will never succeed.
    throw new ERacuniError(`e-racuni error: ${r?.description ?? JSON.stringify(r)}`, true);
  }

  const result = (r?.result ?? r) as Record<string, any>;
  const publicUrl: unknown =
    result?.documentURL ?? result?.publicURL ?? result?.publicUrl ?? result?.documentUrl ?? result?.url ?? result?.URL;
  const documentId = result?.documentID ?? result?.documentId ?? result?.id;
  if (!publicUrl || typeof publicUrl !== 'string') {
    // The invoice may have been created (idempotent), but we can't find the URL field — don't
    // retry. The logged response above shows the real shape so we can fix the field name.
    throw new ERacuniError(
      `no public URL in response (documentID=${documentId ?? '?'}): ${JSON.stringify(data).slice(0, 300)}`,
      true,
    );
  }
  return { publicUrl, documentId: documentId != null ? String(documentId) : undefined };
}

/**
 * Create a fiscalized invoice and return its public URL, retrying transient failures until
 * success or `deadlineMs`. Returns null if e-računi isn't configured, a permanent (payload)
 * error occurs, or the deadline passes — the caller then sends the email without a link.
 */
export async function createFiscalInvoiceWithin(
  input: FiscalInvoiceInput,
  deadlineMs: number,
): Promise<FiscalInvoiceResult | null> {
  const cfg = config();
  if (!cfg) {
    console.warn('[eracuni] skipped: E_RACUNI_* env vars not set');
    return null;
  }
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < deadlineMs) {
    attempt++;
    try {
      return await callOnce(cfg, input);
    } catch (err) {
      const permanent = err instanceof ERacuniError && err.permanent;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[eracuni] attempt ${attempt} failed (permanent=${permanent}): ${msg}`);
      // Never retry a permanent payload/validation error — it wastes the whole deadline and
      // can push the function past its timeout.
      if (permanent) break;
      const remaining = deadlineMs - (Date.now() - start);
      if (remaining <= 1000) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(3000, remaining)));
    }
  }
  console.error(`[eracuni] gave up for ${input.apiTransactionId} after ${attempt} attempt(s)`);
  return null;
}
