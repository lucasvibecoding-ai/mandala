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

export type FiscalInvoiceInput = {
  apiTransactionId: string; // Stripe PaymentIntent id or PayPal order id (idempotency key)
  buyerName?: string;
  buyerEmail?: string;
  description: string; // course name shown on the invoice line
  amount: number; // total the buyer actually paid
  currency: string; // e.g. 'EUR'
  methodOfPayment: 'Stripe' | 'PayPal';
  includeAddon?: boolean; // buyer added the order bump -> append the addon product line
};

export type FiscalInvoiceResult = { publicUrl: string; documentId?: string };

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
  // type "Retail" = consumer receipt (price is the final tax-inclusive amount). We are NOT in
  // the VAT system, so e-računi adds the small-taxpayer exemption note. dateOfSupplyFrom
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

  // With a product code set, reference the defined artikl so the sale corresponds to it —
  // e-računi supplies its price, unit, VAT and name. If the buyer added the order bump, append
  // the addon artikl as its own line. Without a product code we fall back to a single ad-hoc
  // line (description + the exact paid amount, bump included).
  const items = productCode
    ? [
        { productCode, quantity: 1 },
        ...(input.includeAddon && addonProductCode
          ? [{ productCode: addonProductCode, quantity: 1 }]
          : []),
      ]
    : [
        {
          description: input.description,
          quantity: 1,
          unit: 'kom',
          price: input.amount,
          vatPercentage: 0,
        },
      ];

  return {
    dateOfSupplyFrom,
    buyerName: input.buyerName || 'Kupac',
    buyerEMail: input.buyerEmail,
    type: 'Retail',
    methodOfPayment: input.methodOfPayment,
    currency: input.currency,
    ...(documentLanguage ? { documentLanguage } : {}),
    ...(businessUnit ? { businessUnit } : {}),
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
    throw new ERacuniError(`non-JSON response (${res.status}): ${raw.slice(0, 300)}`, res.status >= 500);
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
