import Image from 'next/image';

// The /gift page's "This is what lands in their inbox": the real gift email (emails/GiftRecipient.tsx)
// shown as an opened email in a mail app, with sender, subject and the same dark gift card.
export default function GiftCard({
  to = 'Emma',
  from = 'Sarah',
  message = "Merry Christmas! 🎄❤️ I know how much you love coloring, so this year I wanted to give you something cozy for the long winter evenings: your very own mandalas. Love you lots! ❤️",
}: {
  to?: string;
  from?: string;
  message?: string;
}) {
  return (
    <div className="ge">
      <style dangerouslySetInnerHTML={{ __html: `
        .ge { width: 100%; max-width: 470px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 22px 60px rgba(20,26,51,0.22), 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e6e2dc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: left; }
        .ge-bar { display: flex; align-items: center; gap: 7px; padding: 11px 14px; background: #f4f2ef; border-bottom: 1px solid #e6e2dc; }
        .ge-dot { width: 11px; height: 11px; border-radius: 50%; }
        .ge-head { padding: 16px 18px 14px; border-bottom: 1px solid #efece8; }
        .ge-subject { font-size: 17px; font-weight: 650; color: #1c1c1e; line-height: 1.35; margin: 0 0 12px !important; }
        .ge-from { display: flex; align-items: center; gap: 10px; }
        .ge-avatar { width: 34px; height: 34px; border-radius: 50%; background: #141a33; color: #d4a574; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 16px; flex-shrink: 0; }
        .ge-who { flex: 1; min-width: 0; font-size: 13.5px; line-height: 1.35; color: #1c1c1e; }
        .ge-who b { font-weight: 600; }
        .ge-who span { color: #8a8a8e; }
        .ge-time { font-size: 12px; color: #8a8a8e; align-self: flex-start; }
        .ge-body { background: #efe9df; padding: 18px; }
        .ge-card { background: #141a33; border-radius: 16px; padding: 28px 24px 26px; text-align: center; font-family: Georgia, 'Times New Roman', serif; }
        .ge-eyebrow { color: #d4a574; font-size: 10.5px; letter-spacing: 3.5px; font-weight: 700; margin: 0 0 10px !important; line-height: 1.4; }
        .ge-headline { color: #f6efe4; font-size: 25px; line-height: 1.2; font-weight: 400; margin: 0 0 12px !important; }
        .ge-quote { color: #d9d4ea; font-size: 14.5px; font-style: italic; line-height: 1.6; margin: 0 auto 18px !important; max-width: 330px; }
        .ge-quote::before { content: '\\201C'; display: block; color: #d4a574; font-size: 40px; line-height: 0.7; margin-bottom: 6px; font-style: normal; }
        .ge-img { position: relative; width: 62%; aspect-ratio: 1 / 1; border-radius: 10px; overflow: hidden; margin: 0 auto 18px; }
        .ge-course { color: #f6efe4; font-size: 19px; margin: 0 0 4px !important; line-height: 1.3; }
        .ge-tag { color: #a9adc4; font-size: 13px; line-height: 1.5; margin: 0 0 18px !important; }
        .ge-btn { display: inline-block; background: #d4a574; color: #141a33; font-weight: 700; font-size: 15px; padding: 12px 30px; border-radius: 999px; line-height: 1.3; }
        .ge-fine { color: #8b90aa; font-size: 11.5px; margin: 12px 0 0 !important; line-height: 1.4; }
        @media (max-width: 480px) { .ge-body { padding: 12px; } .ge-card { padding: 24px 16px 22px; } .ge-headline { font-size: 22px; } }
      `}} />
      <div className="ge-bar" aria-hidden="true">
        <span className="ge-dot" style={{ background: '#ff5f57' }} />
        <span className="ge-dot" style={{ background: '#febc2e' }} />
        <span className="ge-dot" style={{ background: '#28c840' }} />
      </div>
      <div className="ge-head">
        <p className="ge-subject">{from} sent you a gift: the Mandala Masterclass</p>
        <div className="ge-from">
          <span className="ge-avatar" aria-hidden="true">A</span>
          <div className="ge-who">
            <b>Aiko</b> <span>&lt;hello@mandalapractice.com&gt;</span>
            <br />
            <span>to {to.toLowerCase()}@example.com</span>
          </div>
          <span className="ge-time">8:00 AM</span>
        </div>
      </div>
      <div className="ge-body">
        <div className="ge-card">
          <p className="ge-eyebrow">FROM {from.toUpperCase()}</p>
          <p className="ge-headline">A gift for you, {to}</p>
          {message && <p className="ge-quote">{message}</p>}
          <div className="ge-img">
            <Image src="/hero.webp" alt="The Mandala Masterclass" fill style={{ objectFit: 'cover' }} />
          </div>
          <p className="ge-course">The Mandala Masterclass</p>
          <p className="ge-tag">Draw your first mandala in 2 hours, even as a complete beginner.</p>
          <span className="ge-btn">Open your gift &rarr;</span>
          <p className="ge-fine">Pick your own email and password. It&apos;s yours for life.</p>
        </div>
      </div>
    </div>
  );
}
