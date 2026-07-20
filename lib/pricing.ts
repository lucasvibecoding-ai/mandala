// Single source of truth for which currency a buyer is priced in, used by BOTH the landing
// page (display) and create-payment-intent (the actual charge) so they can never drift.
//
// €47 and $47 are both amount 4700, so only the currency/symbol flips; the amount is unchanged.
// USD for the Americas + Australia + New Zealand + the dollar countries; EUR for everyone else
// (all of Europe, Africa, the Middle East, Asia) and for unknown location.
export const USD_COUNTRIES = new Set([
  // North America + US territories
  'US', 'CA', 'MX', 'PR', 'VI', 'GU', 'AS', 'MP',
  // Central America
  'GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA',
  // South America
  'CO', 'VE', 'EC', 'PE', 'BO', 'PY', 'UY', 'CL', 'AR', 'BR', 'GY', 'SR',
  // Caribbean
  'CU', 'DO', 'HT', 'JM', 'TT', 'BS', 'BB', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC',
  // Officially use the US dollar elsewhere
  'ZW', 'TL', 'PW', 'MH', 'FM',
  // Australia + New Zealand
  'AU', 'NZ',
]);

export function currencyForCountry(country: string | null | undefined): 'usd' | 'eur' {
  return country && USD_COUNTRIES.has(country.toUpperCase()) ? 'usd' : 'eur';
}

export function currencySymbol(currency: string): string {
  return currency === 'eur' ? '€' : '$';
}
