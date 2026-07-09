// e-računi (e-racuni.com) fiscalization client.
//
// One e-računi organization issues fiscalized invoices for all brands. Fiscalization
// (JIR / ZKI / QR) is automatic on e-računi's side once the org is configured with the
// FINA certificate + registered business premises, so this module only has to create the
// invoice and hand back the public view/download URL that we drop into the buyer's email.
//
// The API is JSON-RPC style: POST { username, secretKey, token, method, parameters } to the
// org-specific endpoint. `apiTransactionId` makes SalesInvoiceCreate idempotent, so retrying
// with the same payment id NEVER creates a duplicate invoice — which is what makes the
// retry-until-deadline below safe.

export type FiscalInvoiceInput = {
  apiTransactionId: string; // Stripe PaymentIntent id or PayPal order id (idempotency key)
  buyerName?: string;
  buyerEmail?: string;
  description: string; // course name shown on the invoice line
  amount: number; // total the buyer actually paid
  currency: string; // e.g. 'EUR'
  methodOfPayment: 'Stripe' | 'PayPal';
};

export type FiscalInvoiceResult = { publicUrl: string; documentId?: string };

function config() {
  const endpoint = process.env.E_RACUNI_ENDPOINT;
  const username = process.env.E_RACUNI_USERNAME;
  const secretKey = process.env.E_RACUNI_SECRET_KEY;
  const token = process.env.E_RACUNI_TOKEN;
  if (!endpoint || !username || !secretKey || !token) return null;
  return { endpoint, username, secretKey, token };
}

function buildSalesInvoice(input: FiscalInvoiceInput) {
  // type "Retail" = consumer receipt (price includes VAT). We are NOT in the VAT system,
  // so vatPercentage is 0 and e-računi adds the small-taxpayer exemption note automatically.
  // NOTE: confirm the exact field names against the org's live API console; adjust here only.
  return {
    buyerName: input.buyerName || 'Kupac',
    buyerEMail: input.buyerEmail,
    type: 'Retail',
    methodOfPayment: input.methodOfPayment,
    currency: input.currency,
    Items: [
      {
        description: input.description,
        quantity: 1,
        unit: 'kom',
        price: input.amount,
        vatPercentage: 0,
      },
    ],
  };
}

async function callOnce(
  cfg: NonNullable<ReturnType<typeof config>>,
  input: FiscalInvoiceInput,
): Promise<FiscalInvoiceResult> {
  const res = await fetch(cfg.endpoint, {
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
    signal: AbortSignal.timeout(15000),
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`e-racuni: non-JSON response (${res.status}): ${raw.slice(0, 300)}`);
  }

  // Log the raw response so we can confirm the exact URL / id field names against the real
  // payload on the first successful call, then tighten the parsing below if needed.
  console.log('[eracuni] SalesInvoiceCreate response:', JSON.stringify(data).slice(0, 1000));

  const d = data as Record<string, any>;
  if (d?.error || d?.errorMessage || d?.Error) {
    throw new Error(`e-racuni error: ${JSON.stringify(d.error ?? d.errorMessage ?? d.Error)}`);
  }

  const r = (d?.result ?? d) as Record<string, any>;
  const publicUrl: unknown =
    r?.publicURL ?? r?.publicUrl ?? r?.documentURL ?? r?.documentUrl ?? r?.url ?? r?.URL;
  if (!publicUrl || typeof publicUrl !== 'string') {
    throw new Error(`e-racuni: no public URL in response: ${JSON.stringify(data).slice(0, 300)}`);
  }
  const documentId = r?.id ?? r?.documentId ?? r?.documentID;
  return { publicUrl, documentId: documentId != null ? String(documentId) : undefined };
}

/**
 * Create a fiscalized invoice and return its public URL, retrying until it succeeds
 * or `deadlineMs` elapses. Returns null if e-računi isn't configured (env vars missing)
 * or the deadline passes without success — the caller then sends the email without a link.
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
      const elapsed = Date.now() - start;
      console.error(`[eracuni] attempt ${attempt} failed after ${elapsed}ms:`, err);
      const remaining = deadlineMs - elapsed;
      if (remaining <= 1000) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(3000, remaining)));
    }
  }
  console.error(`[eracuni] gave up for ${input.apiTransactionId} after ${attempt} attempt(s)`);
  return null;
}
