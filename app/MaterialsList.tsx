import { MATERIALS, amazonUrl, hasAffiliateTag } from '../lib/materials';

// The materials with an Amazon link each (no hooks, works on server and client pages).
export default function MaterialsList({ country }: { country?: string | null }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MATERIALS.map((m) => (
          <a
            key={m.name}
            href={amazonUrl(m.query, country)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', background: '#fff', border: '1px solid #e8dfd2', borderRadius: 10, textDecoration: 'none' }}
          >
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fbf1e6', color: '#b47b45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
            <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
              <span style={{ display: 'block', fontSize: 17, fontWeight: 600, color: '#1a1f3d' }}>{m.name}</span>
              <span style={{ display: 'block', fontSize: 14, color: '#6b7089' }}>{m.note}</span>
            </span>
            <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, color: '#b47b45', whiteSpace: 'nowrap' }}>Amazon &rarr;</span>
          </a>
        ))}
      </div>
      {hasAffiliateTag(country) && (
        <p style={{ fontSize: 12, color: '#9a9184', margin: '10px 0 0' }}>As an Amazon Associate we earn from qualifying purchases.</p>
      )}
    </div>
  );
}
