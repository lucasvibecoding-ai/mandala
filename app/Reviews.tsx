// Student reviews on the sales page (owner 2026-11-10: real reviews from Mandala students,
// first name and initial only). 3 with a photo of what the student made + 6 text-only,
// all in one block before the first price box.

type Review = { name: string; text: string; photo?: string };

const PHOTO: Review[] = [
  {
    name: 'Susan M.',
    photo: '/reviews/susan.jpg',
    text: "I never thought I could draw something like this! I've always loved looking at mandalas but thought they were way too complicated for me. The lessons break everything down into little steps that actually make sense. I was so proud of my first finished mandala!",
  },
  {
    name: 'Carol D.',
    photo: '/reviews/carol.jpg',
    text: "I've tried watercolor, knitting, and about a dozen other crafts over the years. This one is different. I can sit at my kitchen table with just a few pens and a piece of paper. No big mess to clean up afterward either!",
  },
  {
    name: 'Deborah K.',
    photo: '/reviews/deborah.jpg',
    text: "I started with plain black pens but the color guide gave me so many ideas. I've been trying different combinations and it's amazing how the same basic pattern can look completely different. I'm making a few to give as gifts.",
  },
];

const TEXT: Review[] = [
  {
    name: 'Linda B.',
    text: "Such a peaceful way to spend an afternoon. There's something so calming about drawing the same little patterns over and over. Sometimes I completely lose track of time.",
  },
  {
    name: 'Robert T.',
    text: "I honestly cannot draw to save my life lol. But once I learned how to make the circles and divide them into sections, everything started coming together. I still have a lot to practice but I'm really enjoying it!",
  },
  {
    name: 'Barbara H.',
    text: "My favorite part is having the templates ready whenever I feel like drawing. Some evenings I don't want to measure everything out, I just want to sit with my pens and create something pretty. Really lovely course.",
  },
  {
    name: 'Nancy R.',
    text: "The symmetry part intimidated me at first, especially using a compass. But the explanations are clear and you can replay anything you don't understand. After a little practice, the patterns started feeling natural.",
  },
  {
    name: 'David M.',
    text: "I'm retired and was looking for something creative to keep my hands busy. I've been doing a little mandala drawing with my morning coffee and really look forward to it. Such a simple pleasure.",
  },
  {
    name: 'Janet P.',
    text: "For years I told myself I wasn't a creative person. I still make crooked lines and sometimes my circles aren't quite right, but I'm learning not to worry about every little mistake. It's been really nice making something just for myself.",
  },
];

function Stars() {
  return (
    <span className="rv-stars" aria-label="5 out of 5 stars">
      ★★★★★
    </span>
  );
}

function Cards({ list, plain = false }: { list: Review[]; plain?: boolean }) {
  return (
    <ul className={`rv-grid${plain ? ' rv-plain' : ''}`}>
      {list.map((r, i) => (
        <li key={i} className="rv-card">
          {r.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.photo} alt="" className="rv-photo" />
          )}
          <div className="rv-body">
            <Stars />
            <p className="rv-text">&ldquo;{r.text}&rdquo;</p>
            <p className="rv-name">{r.name}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Reviews() {
  return (
    <section id="reviews" className="rv">
      <style>{css}</style>
      <div className="rv-head">
        <p className="rv-eyebrow">Student reviews</p>
        <h2 className="rv-title">What students are making</h2>
      </div>
      <Cards list={PHOTO} />
      <div style={{ height: 20 }} />
      <Cards list={TEXT} plain />
    </section>
  );
}

const css = `
.rv { padding: 56px 0 24px; }
.rv-head { text-align: center; margin-bottom: 32px; }
.rv-eyebrow { font-size: 13px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin: 0 0 8px; }
.rv-title { font-size: 36px; line-height: 1.2; margin: 0; color: var(--ink); text-align: center; }
.rv-summary { margin: 12px 0 0; font-size: 18px; color: var(--ink-muted); }
.rv-stars { color: #e0a43a; letter-spacing: 2px; font-size: 18px; }
.rv-grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.rv-card { background: #fff; border: 1px solid rgba(45,74,143,0.12); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 14px rgba(26,31,61,0.05); display: flex; flex-direction: column; }
.rv-photo { width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block; }
.rv-body { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.rv-text { margin: 0; font-size: 17px; line-height: 1.6; color: var(--ink); flex: 1; }
.rv-name { margin: 0; font-size: 15px; font-weight: 700; color: var(--ink); font-family: system-ui, sans-serif; }
.rv-plain .rv-card { background: var(--indigo-pale); box-shadow: none; }
@media (max-width: 860px) { .rv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) {
  .rv-title { font-size: 28px; }
  .rv-grid { grid-template-columns: 1fr; gap: 16px; }
}
`;
