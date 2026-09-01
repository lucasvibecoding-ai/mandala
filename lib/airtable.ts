const AIRTABLE_API = 'https://api.airtable.com/v0';

interface AirtableConfig {
  apiKey: string;
  baseId: string;
  projectId: string;
}

function getConfig(): AirtableConfig | null {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const projectId = process.env.AIRTABLE_PROJECT_ID;
  if (!apiKey || !baseId || !projectId) return null;
  return { apiKey, baseId, projectId };
}

async function airtableFetch(
  config: AirtableConfig,
  path: string,
  init?: RequestInit
): Promise<Record<string, unknown>> {
  const res = await fetch(`${AIRTABLE_API}/${config.baseId}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable ${res.status}: ${errText}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

function escapeFormulaString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function findCustomerIdByEmail(
  config: AirtableConfig,
  email: string
): Promise<string | null> {
  const formula = `LOWER({Email})=LOWER("${escapeFormulaString(email)}")`;
  const data = (await airtableFetch(
    config,
    `Customers?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`
  )) as { records: Array<{ id: string }> };
  return data.records[0]?.id ?? null;
}

async function createCustomer(
  config: AirtableConfig,
  email: string,
  firstName?: string
): Promise<string> {
  const fields: Record<string, string> = { Email: email };
  if (firstName) fields['First Name'] = firstName;
  const data = (await airtableFetch(config, 'Customers', {
    method: 'POST',
    body: JSON.stringify({ fields, typecast: true }),
  })) as { id: string };
  return data.id;
}

async function upsertCustomer(
  config: AirtableConfig,
  email: string,
  firstName?: string
): Promise<string> {
  const existing = await findCustomerIdByEmail(config, email);
  if (existing) return existing;
  return createCustomer(config, email, firstName);
}

async function findPurchaseIdByTransactionId(
  config: AirtableConfig,
  transactionId: string
): Promise<string | null> {
  const formula = `{Transaction ID}="${escapeFormulaString(transactionId)}"`;
  const data = (await airtableFetch(
    config,
    `Purchases?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`
  )) as { records: Array<{ id: string }> };
  return data.records[0]?.id ?? null;
}

interface RecordPurchaseInput {
  transactionId: string;
  date: Date;
  amount: number;
  /** How they paid: Card, Apple Pay, Google Pay, PayPal, Link */
  provider: string;
  email: string;
  firstName?: string;
  includeAddon?: boolean;
  currency?: string;
  /** The buyer's other address when checkout and PayPal disagree (see below). */
  secondEmail?: string | null;
}

export async function recordPurchase(input: RecordPurchaseInput): Promise<void> {
  const config = getConfig();
  if (!config) {
    console.warn('Airtable not configured (env vars missing) — skipping recordPurchase');
    return;
  }
  try {
    const existing = await findPurchaseIdByTransactionId(config, input.transactionId);
    if (existing) {
      console.log(`Airtable: purchase ${input.transactionId} already exists (${existing}), skipping`);
      return;
    }

    const customerId = await upsertCustomer(config, input.email, input.firstName);

    const fields: Record<string, unknown> = {
      'Transaction ID': input.transactionId,
      Date: input.date.toISOString(),
      Amount: input.amount,
      Status: 'Paid',
      'Payment Provider': input.provider,
      Project: [config.projectId],
      Customer: [customerId],
      Currency: (input.currency || 'usd').toLowerCase(),
    };
    // Only sites that sell an add-on pass includeAddon. The shared base's "Includes Pack"
    // checkbox may not exist yet, so if Airtable rejects it as unknown, record the purchase
    // without it rather than lose the whole row.
    if (input.includeAddon !== undefined) {
      fields['Includes Pack'] = !!input.includeAddon;
    }
    // The Customer link stays the PAYER's address so accounting and the fiscal
    // invoice keep matching. When the buyer typed a different address at checkout,
    // that one goes here so support can find them by either.
    if (input.secondEmail) {
      fields['Second Email'] = input.secondEmail;
    }
    // These two columns may not exist in the shared base yet. If Airtable rejects
    // one as unknown, record the purchase without them rather than lose the row.
    const optional = ['Includes Pack', 'Second Email'];
    try {
      await airtableFetch(config, 'Purchases', {
        method: 'POST',
        body: JSON.stringify({ fields, typecast: true }),
      });
    } catch (err) {
      const present = optional.filter((k) => k in fields);
      if (present.length > 0 && /UNKNOWN_FIELD_NAME|Includes Pack|Second Email/i.test(String(err))) {
        for (const k of present) delete fields[k];
        await airtableFetch(config, 'Purchases', {
          method: 'POST',
          body: JSON.stringify({ fields, typecast: true }),
        });
        console.warn(`Airtable: missing field(s) ${present.join(', ')} — recorded purchase without them`);
      } else {
        throw err;
      }
    }

    console.log(`Airtable: recorded purchase ${input.transactionId} for ${input.email}`);
  } catch (err) {
    console.error('Airtable recordPurchase error:', err);
  }
}
