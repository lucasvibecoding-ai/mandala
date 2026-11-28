// What a student needs for the Mandala Masterclass (the course's Module 2 list, under $30 in total),
// with Amazon links for the buyer's country. Used on /gift, /materials and the gift thank-you page.
// Amazon doesn't allow affiliate links inside emails, so emails link to /materials instead.

export type Material = { name: string; note: string; query: string };

export const MATERIALS: Material[] = [
  { name: 'Fineliner pens', note: 'A set of black pens in a few tip sizes', query: 'black fineliner pens set drawing' },
  { name: 'Drawing compass', note: 'For perfect circles', query: 'drawing compass geometry' },
  { name: 'Drawing paper pad', note: 'Smooth white paper, A4 or Letter', query: 'smooth drawing paper pad A4' },
  { name: 'Pencil and ruler', note: 'Any HB pencil and a clear 30 cm ruler', query: 'HB pencils and clear ruler 30cm' },
];

// Amazon store per buyer country (Vercel's x-vercel-ip-country); everyone else gets amazon.com.
const DOMAINS: Record<string, string> = {
  US: 'amazon.com', GB: 'amazon.co.uk', IE: 'amazon.co.uk', DE: 'amazon.de', AT: 'amazon.de', CH: 'amazon.de',
  FR: 'amazon.fr', BE: 'amazon.fr', IT: 'amazon.it', ES: 'amazon.es', NL: 'amazon.nl', CA: 'amazon.ca',
  AU: 'amazon.com.au', NZ: 'amazon.com.au', SE: 'amazon.se', PL: 'amazon.pl', JP: 'amazon.co.jp',
};

// Amazon Associates tracking ID per store. Empty = plain link (no affiliate tag yet).
// TODO(owner): fill in the Associates tags, e.g. 'amazon.com': 'mandalaclass-20'.
const TAGS: Record<string, string> = {};

export function amazonDomain(country?: string | null) {
  return DOMAINS[(country ?? '').toUpperCase()] ?? 'amazon.com';
}

export function amazonUrl(query: string, country?: string | null) {
  const domain = amazonDomain(country);
  const tag = TAGS[domain];
  return `https://www.${domain}/s?k=${encodeURIComponent(query)}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`;
}

export function hasAffiliateTag(country?: string | null) {
  return !!TAGS[amazonDomain(country)];
}
