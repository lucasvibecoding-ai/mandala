// Buyer country -> Croatian VAT treatment (vrsta prodaje) for the e-računi invoice.
//
// From 2026-09-22 LH INTERNATIONAL HOLDINGS is a Croatian VAT payer registered in OSS, so
// every invoice has to say WHICH regime the sale falls under. The country decides it:
//
//   HR            -> vrsta 0,   25 % Croatian VAT, fiscalized (JIR)
//   other EU B2C  -> vrsta 0 and 25 % until OSS_START, then vrsta 100 at the buyer
//                    country's STANDARD rate (a pre-recorded course is an electronically
//                    supplied service, so no reduced rate ever applies) and the quarterly
//                    OSS return. Verified against the e-računi vrste prodaje table: 100 is
//                    "Obavljene elektronske usluge unutar EU (OSS)". 107 is general services
//                    and 106 is distance sales of goods, neither of which we sell.
//   non-EU        -> vrsta 17,  0 %, place of supply outside Croatia
//
// THE PRICE THE BUYER PAYS IS ALWAYS THE FINAL PRICE. VAT is carved OUT of it, never added
// on top: €47 gross at 25 % is €37.60 net + €9.40 VAT. The margin absorbs the tax. Any line
// we build ourselves must therefore send the gross amount the buyer actually paid.
//
// The resolver mirrors vat-counter/lib/vat.ts so a sale is attributed to the same country in
// the invoice and in the VAT counter. Keep the two in sync when either changes.

// ISO-2 -> standard VAT rate (%). Reviewed 2026-09 against vat-counter/lib/vat.ts.
export const EU_COUNTRIES: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21, DK: 25, EE: 24, FI: 25.5,
  FR: 20, DE: 19, GR: 24, HU: 27, IE: 23, IT: 22, LV: 21, LT: 21, LU: 17,
  MT: 18, NL: 21, PL: 23, PT: 23, RO: 21, SK: 23, SI: 22, ES: 21, SE: 25,
};

// Standard VAT/GST rates (%) of non-EU countries, used ONLY by the tie-break so that the
// invoice resolves a buyer to exactly the same country the VAT counter does. Copied verbatim
// from vat-counter/lib/vat.ts (NON_EU_VAT, last reviewed 2026-09); missing = 0 %.
export const NON_EU_VAT: Record<string, number> = {
  GB: 20, CH: 8.1, LI: 8.1, NO: 25, IS: 24, FO: 25, JE: 5, GG: 0, IM: 20, GI: 0, MC: 20, AD: 4.5,
  SM: 0, AL: 20, BA: 17, ME: 21, MK: 18, RS: 20, XK: 18, MD: 20, UA: 20, BY: 20, RU: 20,
  GE: 18, AM: 20, AZ: 18, TR: 20,
  US: 0, CA: 5, MX: 16, GT: 12, BZ: 12.5, SV: 13, HN: 15, NI: 15, CR: 13, PA: 7, DO: 18,
  PR: 11.5, JM: 15, TT: 12.5, BS: 10, BB: 17.5, HT: 10, KY: 0, BM: 0, VG: 0, AR: 21, BR: 17,
  CL: 19, CO: 19, PE: 18, EC: 15, BO: 13, PY: 10, UY: 22, VE: 16, GY: 14, SR: 10,
  AU: 10, NZ: 15, JP: 10, KR: 10, CN: 13, HK: 0, MO: 0, TW: 5, SG: 9, MY: 8, TH: 7, VN: 10,
  PH: 12, ID: 11, IN: 18, PK: 18, BD: 15, LK: 18, NP: 13, MN: 10, KH: 10, LA: 10, MM: 5,
  MV: 8, BN: 0, FJ: 15, PG: 10, KZ: 12, UZ: 12, KG: 12,
  AE: 5, SA: 15, QA: 0, KW: 0, BH: 10, OM: 5, JO: 16, IL: 18, LB: 11, IQ: 0, IR: 10,
  ZA: 15, NG: 7.5, KE: 16, GH: 15, TZ: 18, UG: 18, RW: 18, ET: 15, EG: 14, MA: 20, TN: 19,
  DZ: 19, CI: 18, SN: 18, CM: 19.25, ZW: 15, ZM: 16, MZ: 16, BW: 14, NA: 15, MU: 15, MG: 20,
  AO: 14,
};

/** Tie-break rate: EU rate, else the non-EU table, else 0. Same as the VAT counter's. */
export function standardVatRate(code: string | null | undefined): number {
  if (!code) return 0;
  const c = code.toUpperCase();
  return EU_COUNTRIES[c] ?? NON_EU_VAT[c] ?? 0;
}

// Printed on every non-EU invoice as the reason no VAT is charged (user, 2026-09-22).
export const NON_EU_VAT_NOTE =
  'PDV nije obračunat sukladno čl. 26. st. 1. t. c) Zakona o PDV-u – mjesto obavljanja usluge izvan RH.';

// Dates that switch the regimes on, as YYYY-MM-DD. Empty = not yet active.
//   VAT_START: the day the org became a Croatian VAT payer in e-računi. Before it, invoices
//   are built exactly as they were, so deploying early cannot break live invoicing.
//   OSS_START: the day EU sales move from Croatian 25 % to destination rates. Pending the
//   accountant's confirmation (OSS normally applies from the next quarter, 2026-10-01).
export const VAT_START = process.env.E_RACUNI_VAT_START ?? '';
export const OSS_START = process.env.E_RACUNI_OSS_START ?? '';

// Where an unresolvable buyer lands (user, 2026-09-22). US = non-EU = vrsta 17, no VAT.
export const FALLBACK_COUNTRY = 'US';

export type VatTreatment = {
  country: string | null;
  /** vrsta prodaje / vatTransactionType on the e-računi document, null before VAT_START. */
  vrsta: 0 | 17 | 100 | null;
  /** VAT rate to charge, carved out of the gross price the buyer already paid. */
  rate: number;
  /** Free-text legal note for the document, or null when e-računi's own note applies. */
  note: string | null;
};

export function normCountry(c: string | null | undefined): string | null {
  if (!c) return null;
  const up = c.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(up) ? up : null;
}

export function isEuCountry(c: string | null | undefined): boolean {
  const n = normCountry(c);
  return !!n && n in EU_COUNTRIES;
}

/**
 * Pick the buyer's country from the payment signals, same rules as the VAT counter:
 * majority vote, a non-EU IP country always wins, ties broken by the lower standard rate.
 * Returns null when no signal resolves; callers land on FALLBACK_COUNTRY.
 */
export function resolveBuyerCountry(signals: {
  ipCountry?: string | null;
  billingCountry?: string | null;
  cardCountry?: string | null;
}): string | null {
  const ip = normCountry(signals.ipCountry);
  const votes = [ip, normCountry(signals.billingCountry), normCountry(signals.cardCountry)].filter(
    (c): c is string => c !== null,
  );
  if (votes.length === 0) return null;

  const tally = new Map<string, number>();
  for (const c of votes) tally.set(c, (tally.get(c) ?? 0) + 1);
  const max = Math.max(...tally.values());
  const leaders = [...tally.keys()].filter((c) => tally.get(c) === max);

  let winner: string;
  if (leaders.length === 1) {
    winner = leaders[0];
  } else {
    // Tie -> lower standard rate, then non-EU, then the IP country, then alphabetical.
    winner = leaders.slice().sort((a, b) => {
      const byRate = standardVatRate(a) - standardVatRate(b);
      if (byRate !== 0) return byRate;
      const byEu = (isEuCountry(a) ? 1 : 0) - (isEuCountry(b) ? 1 : 0);
      if (byEu !== 0) return byEu;
      if (a === ip) return -1;
      if (b === ip) return 1;
      return a.localeCompare(b);
    })[0];
  }

  // A non-EU IP country overrides a vote that landed inside the EU: a buyer sitting in the
  // US with an EU-issued card is still consumption outside the EU.
  if (ip && !isEuCountry(ip) && winner !== ip) return ip;
  return winner;
}

function activeOn(start: string, day: string): boolean {
  return !!start && day >= start;
}

export function vatTreatment(
  country: string | null | undefined,
  day: string = new Date().toISOString().slice(0, 10),
): VatTreatment {
  const c = normCountry(country) ?? FALLBACK_COUNTRY;

  // Not a VAT payer yet on the day of supply: keep the old payload untouched.
  if (!activeOn(VAT_START, day)) return { country: c, vrsta: null, rate: 0, note: null };

  if (c === 'HR') return { country: c, vrsta: 0, rate: 25, note: null };
  if (isEuCountry(c)) {
    // Until OSS starts, an EU sale is invoiced as a domestic one: vrsta 0 at 25 %. Sending
    // vrsta 100 at 25 % would report the sale to OSS at the wrong rate for that country.
    return activeOn(OSS_START, day)
      ? { country: c, vrsta: 100, rate: EU_COUNTRIES[c], note: null }
      : { country: c, vrsta: 0, rate: 25, note: null };
  }
  return { country: c, vrsta: 17, rate: 0, note: NON_EU_VAT_NOTE };
}

/** Net amount hidden inside a gross, tax-inclusive price. Rounded to cents. */
export function netFromGross(gross: number, ratePercent: number): number {
  return Math.round((gross / (1 + ratePercent / 100)) * 100) / 100;
}
