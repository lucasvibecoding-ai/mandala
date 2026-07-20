import type { Metadata } from "next";
import Image from "next/image";
import CheckoutButton from "./CheckoutButton";
import CountdownBar from "./CountdownBar";
import FaqAccordion from "./FaqAccordion";
import { headers } from "next/headers";
import { currencyForCountry, currencySymbol } from "../lib/pricing";

export const metadata: Metadata = {
  title: "Mandala: Learn The Ancient Art Of Meditative Circle Drawing",
  description:
    "Learn the ancient art of mandala drawing at home with no experience. Create beautiful sacred geometry pieces on paper in under 2 hours.",
};

export default async function Home() {
  // Match the checkout currency: EUR for most of the world, USD for the Americas + AU/NZ.
  const sym = currencySymbol(
    currencyForCountry((await headers()).get("x-vercel-ip-country"))
  );
  return (
    <main className="overflow-hidden">
      <CountdownBar />

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg: #ffffff;
          --bg-warm: #f8f6f3;
          --card: #ffffff;
          --ink: #1a1f3d;
          --ink-soft: rgb(26, 31, 61);
          --ink-muted: #6b7089;
          --indigo: #2d4a8f;
          --indigo-deep: #1a2d6b;
          --indigo-soft: #4a6db5;
          --indigo-pale: rgba(45,74,143,0.06);
          --gold: #c7915b;
          --gold-light: #d4a574;
          --gold-pale: rgba(199,145,91,0.08);
          --terra: #5a6b9f;
          --sand: #c8c0b4;
          --stone: #a8a098;
          --cream: #faf8f5;
          --radius: 10px;
          --accent: #2d4a8f;
        }

        /* BASE TYPOGRAPHY */
        .bonsai-page { font-family: 'Lora', 'Lora Fallback', serif; color: rgb(26, 31, 61); line-height: 1.8; font-weight: 400; font-size: 20px; }
        .bonsai-page .container { max-width: 1080px; margin: 0 auto; padding: 0 40px; }

        /* Headings */
        .bonsai-page h1, .bonsai-page h2, .bonsai-page h3 { font-family: 'Lora', serif; color: var(--ink); line-height: 1.25; }
        .bonsai-page h1 { font-size: clamp(2.4rem, 6vw, 3.6rem); font-weight: 600; letter-spacing: -0.5px; text-align: center; margin-bottom: 20px; }
        .bonsai-page h2 { font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 500; margin-bottom: 24px; }
        .bonsai-page h3 { font-size: 30px; font-weight: 600; color: var(--indigo-deep); margin-bottom: 8px; }

        /* Body text */
        .bonsai-page p { margin-bottom: 24px; }
        .bonsai-page strong { color: var(--ink); font-weight: 600; }
        .bonsai-page em { font-style: italic; }
        .bonsai-page a { color: var(--indigo); text-decoration: none; }

        /* Utilities */
        .bonsai-divider { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--sand), transparent); margin: 20px 0; }
        .sm-divider { width: 36px; height: 2px; background: var(--gold); margin: 0 auto; opacity: 0.5; }
        .bonsai-center { text-align: center; }

        /* Badge */
        .badge { display: inline-block; padding: 6px 16px; border: 1.5px solid var(--indigo); border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--indigo); margin-bottom: 20px; }
        .no-exp { font-size: 16px; letter-spacing: 2.5px; margin-bottom: 20px; }
        .hero-sub { font-size: clamp(1.1rem, 2.5vw, 1.5rem); }
        .course-intro { padding: 80px 0 0; }

        /* Hero */
        .hero-img { width: 100%; max-width: 860px; margin: 0 auto; border-radius: 12px; overflow: hidden; aspect-ratio: 16/9; background: var(--bg-warm); border: 1px solid var(--sand); display: flex; align-items: center; justify-content: center; }
        .hero h1 .accent { color: var(--indigo-deep); font-style: italic; }

        /* Philosophy blocks */
        .phil-block { margin-bottom: 32px; padding: 28px 32px; background: var(--card); border-radius: 12px; border: 1px solid var(--sand); }
        .phil-kanji { font-size: 32px; color: var(--gold); margin-bottom: 6px; }
        .phil-title { font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
        .phil-rom { font-size: 15px; color: var(--ink-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; font-weight: 600; }
        .phil-block p { margin-bottom: 0; }

        /* Transform quote */
        .transform { padding: 48px 0; text-align: center; }
        .transform-line { font-size: clamp(1rem, 2.2vw, 1.3rem); color: var(--ink); font-weight: 400; font-style: italic; max-width: 560px; margin: 0 auto; line-height: 1.5; }

        /* Instructor */
        .instructor { padding: 56px 0; display: flex; gap: 32px; align-items: flex-start; }
        .instructor-img { width: 420px; min-width: 420px; border-radius: var(--radius); flex-shrink: 0; overflow: hidden; }

        /* Students */
        .students { padding: 48px 0; text-align: center; }

        /* Objections */
        .objection { padding: 56px 0; }

        /* Module cards */
        .modules-grid { display: flex; flex-direction: column; gap: 16px; }
        .module-card { background: var(--card); border-radius: 12px; padding: 28px; margin-bottom: 16px; border: 1px solid var(--sand); }
        .module-label { font-size: 12px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
        .module-sub { font-size: 18px; color: var(--ink); margin-bottom: 14px; }
        .module-body { display: flex; gap: 28px; align-items: flex-start; }
        .module-card ul { list-style: none; padding: 0; flex: 1; }
        .module-card li { padding: 6px 0; font-size: 18px; line-height: 1.6; }
        .module-img { width: 280px; min-width: 280px; height: 260px; border-radius: 8px; background: linear-gradient(135deg, var(--bg-warm), var(--sand)); display: flex; align-items: center; justify-content: center; font-size: 28px; border: 1px solid var(--sand); overflow: hidden; position: relative; }

        .hereswhatyouget-mobile { display: none; }
        .hero-text-mobile { display: none; }

        /* CTA */
        .cta-block { text-align: center; padding: 56px 0; }
        .price-old { font-size: 34px; color: var(--ink-muted); text-decoration: line-through; margin-bottom: 4px; }
        .price { font-size: 56px; color: var(--indigo-deep); margin-bottom: 4px; font-weight: 700; }
        .price-note { font-size: 20px; color: var(--ink-muted); margin-bottom: 24px; font-weight: 400; }
        .lifetime-break { display: none; }
        .guarantee-badge { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 20px; font-size: 15px; color: var(--ink-muted); }
        .guarantee-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--cream); border: 1.5px solid var(--gold); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .payment-icons { display: flex; gap: 6px; justify-content: center; margin-top: 14px; opacity: 0.4; }
        .payment-icons span { font-size: 12px; padding: 4px 10px; border: 1px solid var(--stone); border-radius: 3px; color: var(--ink-muted); font-weight: 500; }
        .ps-note { margin-top: 16px; font-size: 18px; color: var(--ink-muted); font-style: italic; }

        /* Guarantee section */
        .guarantee-section { padding: 48px 0; text-align: center; }
        .guarantee-section p { max-width: 640px; margin: 0 auto 16px; font-size: 20px; }

        /* Bonus cards */
        .bonus-card { background: var(--card); border-radius: 12px; padding: 28px; margin-bottom: 16px; border: 1px solid var(--sand); }
        .bonus-body { display: flex; gap: 28px; align-items: flex-start; }
        .bonus-img { width: 280px; min-width: 280px; height: 260px; border-radius: 8px; background: linear-gradient(135deg, var(--bg-warm), var(--sand)); display: flex; align-items: center; justify-content: center; font-size: 28px; border: 1px solid var(--sand); overflow: hidden; position: relative; }
        .bonus-card ul { flex: 1; }
        .bonus-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .bonus-label { font-size: 12px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); }
        .bonus-value { font-size: 12px; color: var(--indigo); font-weight: 700; background: rgba(45,74,143,0.1); padding: 2px 10px; border-radius: 100px; letter-spacing: 0.5px; }
        .bonus-card h3 { font-size: 30px; color: var(--ink); margin-bottom: 4px; }
        .module-card h3 { color: var(--ink); }
        .bonus-desc { font-size: 18px; color: var(--ink-muted); margin-bottom: 14px; }
        .bonus-card ul { list-style: none; padding: 0; }
        .bonus-card li { padding: 6px 0; font-size: 18px; line-height: 1.6; }
        .mega { border-color: rgba(45,74,143,0.3); background: linear-gradient(135deg, var(--card), var(--gold-pale)); }

        /* Stack */
        .stack-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); max-width: 520px; margin-left: auto; margin-right: auto; }
        .stack-row .label { color: var(--ink-soft); }
        .stack-row .val { color: var(--indigo-deep); font-weight: 800; font-size: 17px; }
        .stack-total { font-weight: 700; border-bottom: 2px solid var(--indigo); padding-bottom: 10px; margin-bottom: 6px; }
        .stack-total .label { color: var(--ink); }

        /* FAQ */
        .faq-list { display: flex; flex-direction: column; gap: 12px; }
        .faq-item { background: var(--cream); border-radius: 12px; padding: 4px 20px; border: 1px solid var(--sand); }
        .faq-q { width: 100%; display: flex; align-items: center; gap: 14px; padding: 18px 0; background: none; border: none; cursor: pointer; text-align: left; font-family: 'Lora', serif; font-size: 18px; }
        .faq-badge { width: 28px; height: 28px; border-radius: 50%; background: var(--indigo-pale); color: var(--indigo); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .faq-q-text { flex: 1; font-weight: 700; color: var(--ink); }
        .faq-icon { color: var(--indigo); font-size: 20px; transition: transform 0.2s; flex-shrink: 0; }
        .faq-icon.open { transform: rotate(45deg); }
        .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s; }
        .faq-answer.open { max-height: 400px; padding-bottom: 18px; }
        .faq-answer-inner { padding-left: 42px; }
        .faq-a { color: var(--ink-muted); line-height: 1.75; margin: 0; }

        /* Closing */
        .closing { padding: 56px 0; text-align: center; }
        .closing-quote { font-size: clamp(1.3rem, 2.5vw, 1.8rem); color: var(--ink); font-style: italic; max-width: 520px; margin: 0 auto 28px; line-height: 1.5; }

        /* Footer */
        .bonsai-footer { padding: 44px 0; text-align: center; font-size: 14px; color: #999; background: #0a0e1a; margin-top: 48px; }
        .bonsai-footer a { color: #4a6db5; }
        .bonsai-footer p { color: #999; }

        /* Split layout */
        .split { display: flex; gap: 40px; align-items: center; padding: 56px 0; }
        .split-text { flex: 1; }
        .split-text h2 { font-size: clamp(1.6rem, 4vw, 2.4rem); }
        .split-img { flex: 1 1 50%; height: 380px; border-radius: 12px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; overflow: hidden; }

        @media (max-width: 768px) {
          .fillpic-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bonsai-page .container { padding: 0 24px; }
          .bonsai-page section { padding-left: 0; padding-right: 0; }
          .split { flex-direction: column; gap: 24px; }
          .split-img { flex: none; width: 100%; height: auto; }
          .split-text { flex: 1 !important; }
          .module-body { flex-direction: column; }
          .module-img { width: 100%; min-width: unset; height: auto; aspect-ratio: 1/1; }
          .bonus-body { flex-direction: column; }
          .bonus-img { width: 100%; min-width: unset; height: auto; aspect-ratio: 1/1; }
          .module-card, .bonus-card { padding: 20px; }
          .instructor { flex-direction: column; align-items: center; }
          .instructor-text { text-align: left; }
          .course-intro { padding-top: 20px !important; }
          .hero-divider { display: none !important; }
          .price-old { font-size: 28px !important; }
          .checkout-box { padding: 24px 16px !important; padding-bottom: 16px !important; }
          .cta-btn { font-size: 1.3rem !important; }
          .ps-note { font-size: 16px !important; margin-bottom: 0 !important; }
          .instructor-img { width: 100% !important; max-width: 400px !important; height: auto !important; padding: 0 24px; border-radius: 16px; }
          .phil-block { padding: 20px; }
          .stack-row { max-width: 100%; }
          .closing-quote { font-size: 1.2rem; }
          .bonus-header { flex-wrap: wrap; }
          .no-exp { font-size: 14px !important; letter-spacing: 1.5px !important; margin-bottom: 12px !important; }
          .hero-sub { font-size: 18px !important; }
          .hero-split { padding-top: 12px !important; }
        }
        @media (max-width: 480px) {
          .lifetime-break { display: block; }
          .bonsai-page .container { padding: 0 24px; }
          .bonsai-page { font-size: 20px; }
          .bonsai-page p:not(.now-only):not(.no-exp):not(.hero-sub):not(.guarantee-text):not(.ps-note), .bonsai-page li { font-size: 20px !important; }
          .hero-sub { font-size: 18px !important; }
          .module-img, .bonus-img { height: auto; aspect-ratio: 1/1; }
          .hereswhatyouget-desktop { display: none !important; }
          .hereswhatyouget-mobile { display: block !important; }
          .hero-text-desktop { display: none !important; }
          .hero-text-mobile { display: block !important; }
          .no-exp { font-size: 14px !important; letter-spacing: 1.5px !important; margin-bottom: 12px !important; }
          .bonus-card h3, .module-card h3 { margin-bottom: 14px !important; }
          .bonus-desc, .module-sub { margin-bottom: 22px !important; }
          .badge { font-size: 10px; letter-spacing: 1.5px; padding: 5px 12px; }
          .payment-method-btn { font-size: 13px; padding: 10px 12px; }
          #hero { width: 100% !important; margin-top: 16px; }
          .below-hero-row { width: 100% !important; }
          .anyone-section { padding-top: 0px !important; }
          .store-bought-section { padding-bottom: 40px !important; }
          .impossible-section { padding-top: 24px !important; }
          .stunning-section { padding-top: 16px !important; margin-top: 0 !important; }
          .whats-inside { font-size: 32px !important; }
          .module-card h3, .bonus-card h3 { font-size: 24px !important; }
          .now-only { font-size: 36px !important; }
          .price-old { font-size: 28px !important; }
          .cta-btn { font-size: 1.3rem !important; }
          .faq-q-text { font-weight: 500 !important; font-size: 18px !important; }
          .faq-q { font-size: 18px !important; }
          .stack-row { padding: 6px 0 !important; font-size: 18px; }
          .stack-row .val { font-size: 18px !important; }
          .checkout-box { padding: 24px 20px !important; }
        }
      `}} />

      <div className="bonsai-page">
        <div className="container">

          {/* HERO */}
          <section style={{ paddingTop: 64, paddingBottom: 48, textAlign: 'center' }}>
            <p className="no-exp" style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>For The First Time Online</p>
            <h1><span style={{ background: 'linear-gradient(135deg, #2d4a8f, #4a6db5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 4px rgba(45,74,143,0.2))' }}>Mandala:</span> Learn The Ancient Art Of Meditative Circle Drawing</h1>
            <p className="hero-sub" style={{ color: 'var(--ink-muted)', marginTop: 8, fontStyle: 'italic' }}>Your first mandala in 2 hours even if you&apos;re a complete beginner.</p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28, gap: 12 }}>
              <div id="hero" style={{ width: '90%', maxWidth: 640, aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 12px 40px rgba(26,45,107,0.3), 0 4px 12px rgba(0,0,0,0.1)' }}>
                <Image src="/hero.webp" alt="Mandala Masterclass" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="below-hero-row" style={{ display: 'flex', gap: 12, width: '90%', maxWidth: 640 }}>
                <div style={{ flex: 1, aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: '0 6px 20px rgba(26,45,107,0.2)' }}>
                  <Image src="/below_hero1.webp" alt="Mandala example" fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: '0 6px 20px rgba(26,45,107,0.2)' }}>
                  <Image src="/below_hero2.webp" alt="Mandala example" fill style={{ objectFit: 'cover' }} />
                </div>
              </div>
            </div>
          </section>

          {/* IMAGINE IF YOU COULD */}
          <section style={{ padding: '24px 0 56px' }}>
            <div style={{ maxWidth: 672, margin: '0 auto' }}>
              <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 500, marginBottom: 16 }}>
                Imagine if you could:
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 'clamp(1.125rem, 2vw, 1.25rem)', lineHeight: 1.75 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <span style={{ color: 'var(--accent)', marginTop: 4, flexShrink: 0 }}>&#8594;</span>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: 'var(--accent)' }}>create one-of-a-kind mandalas using an ancient sacred geometry technique</strong> that produces pieces so beautiful they look like they belong in a meditation studio.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <span style={{ color: 'var(--accent)', marginTop: 4, flexShrink: 0 }}>&#8594;</span>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: 'var(--accent)' }}>transform a blank sheet of paper into timeless sacred geometry</strong> that you can frame, hang on your wall, or gift to someone you love.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <span style={{ color: 'var(--accent)', marginTop: 4, flexShrink: 0 }}>&#8594;</span>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: 'var(--accent)' }}>have a calming, meditative creative hobby</strong> that takes you offline and into a world of lines, patterns, and quiet focus.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <span style={{ color: 'var(--accent)', marginTop: 4, flexShrink: 0 }}>&#8594;</span>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: 'var(--accent)' }}>make handmade pieces that cost under {sym}5 in materials</strong> but look like they came from a sacred geometry artisan.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* THE MOMENT IT CLICKS */}
          <section className="impossible-section" style={{ padding: '64px 0 24px' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 44 }}>You might be thinking this is extremely hard.</h2>
            <p>A 2,000-year-old sacred geometry tradition? It sounds like something <strong>only trained artists or spiritual masters can pull off.</strong></p>
            <p>But what if I told you that <strong>you don&apos;t need artistic talent, expensive equipment, or any prior experience?</strong></p>
          </section>

          <section style={{ padding: '48px 0 32px' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 44 }}>Here&apos;s what most people don&apos;t realize.</h2>
            <p><strong>The most intricate mandalas come from the simplest patterns.</strong></p>
            <p>A center dot, a compass, and a handful of repeating shapes across clean paper. {sym}30 of materials. That&apos;s all it takes to create something breathtaking.</p>
            <p>As long as the center is set right and the rings are measured correctly, <strong>the pattern reveals itself.</strong></p>
            <p>You mark the center. You breathe. You divide the circle. And suddenly, you&apos;re holding a piece of art.</p>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }} className="fillpic-grid">
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic1.webp" alt="Mandala example 1" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic2.webp" alt="Mandala example 2" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic3.webp" alt="Mandala example 3" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic4.webp" alt="Mandala example 4" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic5.webp" alt="Mandala example 5" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic6.webp" alt="Mandala example 6" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic7.webp" alt="Mandala example 7" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
              <Image src="/fill_pic8.webp" alt="Mandala example 8" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>

          <section className="stunning-section" style={{ padding: '48px 0 64px', marginTop: 32 }}>
              <h2 style={{ marginBottom: 44, textAlign: 'center' }}>&quot;Will my <span style={{ color: 'var(--accent)' }}>mandala</span> look as stunning as yours, even if I&apos;m not artistic?&quot;</h2>
              <p><strong>Yes.</strong></p>
              <p>You&apos;re not sketching or freehand drawing. The <strong>geometry</strong> creates the image. You just set the compass, breathe, and divide.</p>
              <p>If you can sign your name, you can do this.</p>
              <p>This course teaches you the three things that matter:<br />how you place the center, how you divide the circle, and how you repeat your motifs.</p>
          </section>

          {/* ANYONE CAN LEARN */}
          <section className="anyone-section" style={{ padding: '48px 0' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 64 }}>Anyone can learn <span style={{ color: 'var(--accent)' }}>mandala art</span>.</h2>
            <div style={{ maxWidth: 640, margin: '0 auto', fontSize: 20 }}>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; Even if you&apos;ve never held a compass.</span> A clear step-by-step method that works with basic materials and zero experience.</p>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; Even if you think sacred geometry is too complex.</span> It&apos;s not. You just never had the right teacher.</p>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; Even if every craft you&apos;ve tried ended in frustration.</span> Mandala art is forgiving by nature. The symmetry hides almost every &quot;mistake&quot; and turns it into part of the design.</p>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; Even if you don&apos;t consider yourself &quot;artistic.&quot;</span> A pen, a compass, some paper, and a little patience. That&apos;s it.</p>
            </div>
          </section>

          {/* PHILOSOPHY */}
          <section style={{ padding: '48px 0' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 8, fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}>The Philosophy Behind the Practice</h2>
            <p className="bonsai-center" style={{ margin: '0 auto 28px' }}>Mandala art carries four Sanskrit principles that quietly change how you see creativity, balance, and yourself.</p>

            <div className="phil-block">
              <div className="phil-kanji">&#2348;&#2367;&#2344;&#2381;&#2342;&#2369;</div>
              <div className="phil-title">Bindu</div>
              <div className="phil-rom">The center point</div>
              <p>Every mandala begins with a single dot. That dot is the seed. Everything else radiates out from there.</p>
            </div>

            <div className="phil-block">
              <div className="phil-kanji">&#2351;&#2344;&#2381;&#2340;&#2381;&#2352;</div>
              <div className="phil-title">Yantra</div>
              <div className="phil-rom">Sacred geometry</div>
              <p>Order from the simplest rules. A circle, a grid, a rhythm of shapes. Within that order, your hand makes the piece alive.</p>
            </div>

            <div className="phil-block">
              <div className="phil-kanji">&#2360;&#2350;&#2366;&#2343;&#2367;</div>
              <div className="phil-title">Samadhi</div>
              <div className="phil-rom">Meditative absorption</div>
              <p>Your hand takes over. Your mind gets quiet. The pattern draws itself. The mandala is just what&apos;s left.</p>
            </div>

            <div className="phil-block">
              <div className="phil-kanji">&#2310;&#2344;&#2344;&#2381;&#2342;</div>
              <div className="phil-title">Ananda</div>
              <div className="phil-rom">Bliss through creation</div>
              <p>Just you, pen, and paper. Every ring, every petal, every line holds a quiet joy in it.</p>
            </div>
          </section>

          {/* INSTRUCTOR */}
          <section className="instructor">
            <div className="instructor-img">
              <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                <Image src="/creator.webp" alt="Aiko Mori" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div className="instructor-text">
              <h2>My name is Aiko Mori.</h2>
              <p><strong>15+ years practicing and teaching mandala art.</strong> From traditional Tibetan mandalas to modern geometric designs. From pocket-sized pieces to large canvas works and full gallery commissions.<br /><br />Over <strong>300 original mandalas</strong> drawn. Taught <strong>500+ students</strong> in workshops across three countries to draw their first mandala from scratch.</p>
              <p>I picked up mandala drawing feeling burned out and creatively empty. Within a week I was drawing circles on every scrap of paper in my house. <strong>That obsession never left.</strong> I just learned to channel it.</p>
            </div>
          </section>

          {/* COURSE INTRO */}
          <section className="bonsai-center course-intro">
            <h2 style={{ marginBottom: 4, fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 600 }}>Introducing: The Mandala<br />Masterclass</h2>
            <p style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>&#2350;&#2339;&#2381;&#2337;&#2354; &#12539; From blank paper to sacred geometry.</p>
          </section>

          {/* HERESWHATYOUGET IMAGE */}
          <div className="bonsai-center" style={{ marginBottom: 32 }}>
            <div className="hereswhatyouget-desktop" style={{ position: 'relative', width: '100%', maxWidth: 700, margin: '0 auto' }}>
              <Image src="/hereswhatyouget.webp" alt="Everything included in the course" width={700} height={500} style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
            </div>
            <div className="hereswhatyouget-mobile" style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
              <Image src="/hereswhatyouget_mobile.webp" alt="Everything included in the course" width={400} height={600} style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
            </div>
            <p style={{ margin: '20px auto 0', fontSize: 18, color: 'var(--ink-muted)' }}><strong style={{ color: 'var(--ink)' }}>2+ hours of step-by-step videos</strong> across 15+ lessons</p>
          </div>

          {/* MODULES */}
          <section style={{ padding: '20px 0 40px' }}>
            <h2 className="bonsai-center whats-inside" style={{ marginTop: 86, marginBottom: 24 }}>&#10022; What&apos;s Inside &#10022;</h2>

            <div className="module-card">
              <div className="module-label">Module 1</div>
              <h3><span style={{ color: 'var(--accent)' }}>Sacred Circles</span> (Understanding Mandalas)</h3>
              <div className="module-sub">The history, philosophy, and principles behind every beautiful mandala.</div>
              <div className="module-body">
                <div className="module-img"><Image src="/module1.webp" alt="Module 1 - Sacred Circles" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; The <strong>2,000-year history of the mandala</strong> across Hindu, Buddhist, and Tibetan traditions and why this art form has endured across cultures</li>
                  <li>&#10022; The <strong>four mandala traditions</strong> (Tibetan, Hindu yantra, healing, freeform) and which ones create the most striking results for beginners</li>
                  <li>&#10022; Why <strong>simple repeating patterns with proper symmetry</strong> produce more beautiful mandalas than complex freeform designs</li>
                  <li>&#10022; How to <strong>read and understand mandala compositions</strong> so you can design your own</li>
                </ul>
              </div>
            </div>

            <div className="module-card">
              <div className="module-label">Module 2</div>
              <h3><span style={{ color: 'var(--accent)' }}>Your Mandala Toolkit</span> (Materials &amp; Setup)</h3>
              <div className="module-sub">Your complete shopping list and workspace setup for under {sym}30.</div>
              <div className="module-body">
                <div className="module-img"><Image src="/module2.webp" alt="Module 2 - Your Mandala Toolkit" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; The <strong>{sym}30 shopping list</strong> with exact product links that gives you everything you need for your first 10+ mandalas</li>
                  <li>&#10022; The <strong>best pens for beginners</strong> and why a single mid-weight fineliner is your secret weapon</li>
                  <li>&#10022; <strong>Compass vs freehand:</strong> when to use each and why most beginners pick the wrong one</li>
                  <li>&#10022; How to <strong>set up your drawing station</strong> at any desk or kitchen table in 10 minutes</li>
                </ul>
              </div>
            </div>

            <div className="module-card">
              <div className="module-label">Module 3</div>
              <h3><span style={{ color: 'var(--accent)' }}>Foundation Patterns &amp; Symmetry</span></h3>
              <div className="module-sub">Learn to control your grid and your line before you draw a single motif. The foundation every mandala rests on.</div>
              <div className="module-body">
                <div className="module-img"><Image src="/module3.webp" alt="Module 3 - Foundation Patterns & Symmetry" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; How to <strong>build a symmetry grid</strong> step by step for perfect, balanced compositions</li>
                  <li>&#10022; The <strong>three grid systems</strong> (4-fold, 6-fold, 8-fold) and why your mandala comes alive when you combine them</li>
                  <li>&#10022; <strong>Dot, line, arc:</strong> the three basic marks that make up every traditional pattern</li>
                  <li>&#10022; <strong>Pattern effects:</strong> repetition, mirroring, and negative space that bring your paper to life</li>
                </ul>
              </div>
            </div>

            <div className="module-card">
              <div className="module-label">Module 4</div>
              <h3><span style={{ color: 'var(--accent)' }}>The Core Motifs</span> (Traditional Mandala Elements)</h3>
              <div className="module-sub">The four traditional motifs every mandala artist begins with. This is where blank paper becomes sacred geometry.</div>
              <div className="module-body">
                <div className="module-img"><Image src="/module4.webp" alt="Module 4 - The Core Motifs" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; <strong>Lotus petals:</strong> the flowing shapes that teach form and graceful line</li>
                  <li>&#10022; <strong>Concentric rings:</strong> the foundational circles that teach rhythm, spacing, and restraint</li>
                  <li>&#10022; <strong>Geometric knots:</strong> the interlocking shapes that teach structure and composition</li>
                  <li>&#10022; <strong>Dot-work:</strong> the stippling technique that teaches patience and life</li>
                </ul>
              </div>
            </div>

            <div className="module-card">
              <div className="module-label">Module 5</div>
              <h3><span style={{ color: 'var(--accent)' }}>Advanced Mandalas</span> (Multi-Ring Compositions)</h3>
              <div className="module-sub">The traditional next step after the Core Motifs. Layers, color, and depth &#8212; the full sacred geometry of classical mandala art.</div>
              <div className="module-body">
                <div className="module-img"><Image src="/module5.webp" alt="Module 5 - Advanced Mandalas" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; <strong>Multi-ring structure:</strong> the foundational technique that gives your mandala weight and depth</li>
                  <li>&#10022; <strong>Negative space and breathing room:</strong> how pattern density and open space bring movement and atmosphere</li>
                  <li>&#10022; <strong>Layered motifs and nested symmetry:</strong> combining patterns to suggest entire worlds inside a single circle</li>
                  <li>&#10022; <strong>Classical composition:</strong> center, middle, and outer &#8212; the three-depth rule behind every great mandala</li>
                </ul>
              </div>
            </div>
          </section>


          {/* CTA after modules */}
          <section style={{ padding: '56px 0' }}>
            <div className="bonsai-center" style={{ marginBottom: 32 }}>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>You&apos;ve seen what&apos;s inside. Five modules. A complete system for learning, creating, and mastering mandala art at home.</p>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>The full price for this course is <strong><s>{sym}97</s></strong>.</p>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>You&apos;re not going to pay that today. And the reason is simple.</p>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>This is the first time I&apos;ve offered this course to the public. I want <strong>50 people</strong> to go through it. I want to read your emails, see your mandalas, find out where you get stuck and where you surprise yourself.</p>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>That feedback is worth more to me right now than charging full price. Honestly, I also need to find out if I can handle 50 support inboxes without accidentally spilling coffee on my sketchbook.</p>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>So for this first group, the price is <strong>dramatically lower</strong>. Once those 50 spots fill, this page comes down and the full price goes live.</p>
            </div>
            <div className="checkout-box" style={{ maxWidth: 520, margin: '0 auto', padding: '40px 44px', borderRadius: 14, border: '2px solid rgba(45,74,143,0.25)', background: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div className="price-old">Normally {sym}97</div>
              <p id="get-access" className="now-only" style={{ fontSize: 44, color: 'var(--ink)', fontWeight: 700, marginBottom: 8 }}>Now Only <span style={{ color: '#2d4a8f' }}>{sym}47</span></p>
              <div className="price-note">One time payment. <span className="lifetime-break" />Lifetime access.</div>
              <div style={{ marginTop: 20 }}><CheckoutButton /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
                <p style={{ margin: 0, fontWeight: 500, fontSize: 16, whiteSpace: 'nowrap', color: 'var(--ink-muted)' }} className="guarantee-text">90 Day Money Back Guarantee</p>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
              </div>
              <p style={{ color: 'var(--ink-muted)', marginBottom: 12, marginTop: 20 }}>&#128274; Secure payment &#128274;</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <Image src="/visa.svg" alt="Visa" width={40} height={26} style={{ height: 26, width: 'auto' }} />
                <Image src="/mastercard.svg" alt="Mastercard" width={40} height={26} style={{ height: 26, width: 'auto' }} />
                <Image src="/american-express.svg" alt="Amex" width={40} height={26} style={{ height: 26, width: 'auto' }} />
                <Image src="/discover.svg" alt="Discover" width={40} height={26} style={{ height: 26, width: 'auto' }} />
                <Image src="/paypal.svg" alt="PayPal" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              </div>
              <div style={{ width: 48, height: 1, background: 'rgba(0,0,0,0.1)', margin: '20px auto' }} />
              <p className="ps-note">P.S. If the next page doesn&apos;t load... I&apos;m sorry, but the deal has ended!</p>
            </div>
          </section>

          {/* GUARANTEE */}
          <section className="guarantee-section">
            <Image src="/guarantee1.webp" alt="90 Day Money Back Guarantee" width={160} height={160} style={{ width: 130, height: 130, marginBottom: 16, margin: '0 auto 16px', display: 'block' }} />
            <h2 style={{ textAlign: 'center' }}>Try it risk-free</h2>
            <p style={{ fontSize: 20 }}><strong>You don&apos;t have to make the final decision now.</strong></p>
            <p style={{ textAlign: 'left', fontSize: 20 }}>Get access to the full course. Get your materials. Learn the foundational patterns. Draw your first mandala masterpiece. Watch your skills grow with every new piece.</p>
            <p style={{ textAlign: 'left', fontSize: 20 }}>If you don&apos;t love it, email hello@mandalapractice.com within 90 days for a full refund. Within 24 hours. <strong>No questions asked.</strong></p>
          </section>

          {/* BONUSES */}
          <section style={{ padding: '36px 0' }}>
            <p className="bonsai-center" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>But wait, there&apos;s more</p>
            <h2 className="bonsai-center" style={{ marginBottom: 24 }}>Order today and you also get:</h2>

            <div className="bonus-card">
              <div className="bonus-header"><div className="bonus-label">Bonus 1</div><div className="bonus-value">{sym}47 value</div></div>
              <h3><span style={{ color: 'var(--accent)' }}>10 Printable Mandala Templates</span></h3>
              <div className="bonus-desc">Hit print, grab your pens, and start. 10 ready-to-ink templates so you never face a blank page on the days you don&apos;t feel like designing one from scratch.</div>
              <div className="bonus-body">
                <div className="bonus-img"><Image src="/bonus1.webp" alt="Bonus 1 - 10 Printable Mandala Templates" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; <strong>10 line-art templates</strong> ranging from beginner to advanced, sized for both Letter and A4 paper</li>
                  <li>&#10022; <strong>Every symmetry style covered</strong> (4-fold, 6-fold, 8-fold, 12-fold) so you practice each grid system on a real composition</li>
                  <li>&#10022; <strong>Themed range</strong> (lunar, floral, geometric, chakra) so you can match your mood to your mandala</li>
                  <li>&#10022; <strong>High-resolution PDFs</strong> that print crisp every time &#8212; no pixelation, no faint lines</li>
                </ul>
              </div>
            </div>

            <div className="bonus-card">
              <div className="bonus-header"><div className="bonus-label">Bonus 2</div><div className="bonus-value">{sym}37 value</div></div>
              <h3>The <span style={{ color: 'var(--accent)' }}>Intention Series:</span> 10 Ritual Mandala Templates</h3>
              <div className="bonus-desc">10 more templates &#8212; but each one is a ritual. Every mandala is paired with a specific intention, an intention card to read before you start, and a suggested palette tied to that meaning. Drawing it becomes a practice, not just a coloring page.</div>
              <div className="bonus-body">
                <div className="bonus-img"><Image src="/bonus2.webp" alt="Bonus 2 - The Intention Series: 10 Ritual Mandala Templates" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; <strong>10 templates, each tied to a specific intention</strong> &#8212; gratitude, release, focus, peace, abundance, courage, clarity, healing, presence, and joy</li>
                  <li>&#10022; <strong>An intention card with each template</strong> &#8212; a short reflection to read before you draw so the practice has a center</li>
                  <li>&#10022; <strong>A suggested palette for every intention</strong> so the color you use carries the meaning, not just the look</li>
                  <li>&#10022; <strong>Designed to be drawn slowly</strong> &#8212; symmetry simple enough that your mind can rest while your hand works</li>
                </ul>
              </div>
            </div>

            <div className="bonus-card">
              <div className="bonus-header"><div className="bonus-label">Bonus 3</div><div className="bonus-value">{sym}27 value</div></div>
              <h3>The <span style={{ color: 'var(--accent)' }}>Color Harmony Guide</span></h3>
              <div className="bonus-desc">The color palette is what separates a practice sheet from a finished mandala. This guide shows you how to choose, mix, and place colors like a traditional master.</div>
              <div className="bonus-body">
                <div className="bonus-img"><Image src="/bonus3.webp" alt="Bonus 3 - The Color Harmony Guide" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; How to <strong>choose your personal palette</strong> using traditional Tibetan, Hindu, and modern color schemes</li>
                  <li>&#10022; <strong>Where to order quality pigments and colored fineliners</strong> for under {sym}20, online and locally</li>
                  <li>&#10022; <strong>Traditional color placement</strong> and the meaning behind each position in the mandala</li>
                  <li>&#10022; How to <strong>finish and present your work</strong> so it looks authentic, intentional, and collector-grade</li>
                </ul>
              </div>
            </div>
          </section>

          {/* FIRST STACK + CTA */}
          <section style={{ padding: '36px 0' }} id="pricing">
            <h2 className="bonsai-center" style={{ marginBottom: 18 }}>Here&apos;s everything you get:</h2>
            <div className="stack-row stack-total"><span className="label">&#10003; 5 Core Modules</span><span className="val">{sym}139</span></div>
            <div className="stack-row"><span className="label">&#10003; 10 Printable Mandala Templates</span><span className="val">{sym}47</span></div>
            <div className="stack-row"><span className="label">&#10003; The Intention Series: 10 Ritual Templates</span><span className="val">{sym}37</span></div>
            <div className="stack-row"><span className="label">&#10003; The Color Harmony Guide</span><span className="val">{sym}27</span></div>
            <div className="stack-row" style={{ borderBottom: 'none' }}><span className="label" style={{ fontWeight: 700, color: 'var(--ink)' }}>Total Value</span><span className="val" style={{ fontSize: 16 }}>{sym}250</span></div>
          </section>

          <div className="checkout-box" style={{ maxWidth: 520, margin: '0 auto', padding: '40px 44px', borderRadius: 14, border: '2px solid rgba(45,74,143,0.25)', background: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div className="price-old">Normally {sym}97</div>
            <p className="now-only" style={{ fontSize: 44, color: 'var(--ink)', fontWeight: 700, marginBottom: 8 }}>Now Only <span style={{ color: '#2d4a8f' }}>{sym}47</span></p>
            <div className="price-note">One time payment. <span className="lifetime-break" />Lifetime access.</div>
            <div style={{ marginTop: 20 }}><CheckoutButton /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
              <p style={{ margin: 0, fontWeight: 500, fontSize: 16, whiteSpace: 'nowrap', color: 'var(--ink-muted)' }} className="guarantee-text">90 Day Money Back Guarantee</p>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
            </div>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 12, marginTop: 20 }}>&#128274; Secure payment &#128274;</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Image src="/visa.svg" alt="Visa" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/mastercard.svg" alt="Mastercard" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/american-express.svg" alt="Amex" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/discover.svg" alt="Discover" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/paypal.svg" alt="PayPal" width={40} height={26} style={{ height: 26, width: 'auto' }} />
            </div>
            <div style={{ width: 48, height: 1, background: 'rgba(0,0,0,0.1)', margin: '20px auto' }} />
            <p className="ps-note">P.S. If the next page doesn&apos;t load... I&apos;m sorry, but the deal has ended!</p>
          </div>

          {/* MEGA BONUS */}
          <section style={{ padding: '64px 0 64px' }}>
            <p className="bonsai-center" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>One last thing...</p>
            <h2 className="bonsai-center" style={{ marginBottom: 18 }}>Order today and you also get:</h2>

            <div className="bonus-card mega">
              <div className="bonus-header"><div className="bonus-label">Mega Bonus</div><div className="bonus-value">{sym}79 value</div></div>
              <h3><span style={{ color: 'var(--accent)' }}>The Master Color Series:</span> 10 Fully Colored Mandalas</h3>
              <div className="bonus-desc">Ten finished, fully colored mandalas with the exact palette and color order behind each. The reference library that shows you what your work can become.</div>
              <div className="bonus-body">
                <div className="bonus-img"><Image src="/megabonus.webp" alt="Mega Bonus - The Master Color Series: 10 Fully Colored Mandalas" fill style={{ objectFit: 'cover' }} /></div>
                <ul>
                  <li>&#10022; <strong>10 fully colored mandalas</strong> photographed in detail &#8212; each one a complete, frame-ready reference piece</li>
                  <li>&#10022; <strong>The exact palette for every piece</strong> &#8212; hex codes, pen brands, and pencil names so you can recreate the look</li>
                  <li>&#10022; <strong>Step-by-step color order</strong> showing which rings get colored first and how the layers build into depth</li>
                  <li>&#10022; <strong>Matching blank templates included</strong> so you can color each one yourself before designing your own from scratch</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="bonsai-divider" />

          {/* FAQ */}
          <section style={{ padding: '40px 0' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 24 }}>Students Usually Ask</h2>
            <FaqAccordion />
          </section>

          <div className="bonsai-divider" />

          {/* SECOND STACK + CTA */}
          <section style={{ padding: '36px 0' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 18 }}>Here&apos;s everything you get:</h2>
            <div className="stack-row stack-total"><span className="label">&#10003; 5 Core Modules</span><span className="val">{sym}139</span></div>
            <div className="stack-row"><span className="label">&#10003; 10 Printable Mandala Templates</span><span className="val">{sym}47</span></div>
            <div className="stack-row"><span className="label">&#10003; The Intention Series: 10 Ritual Templates</span><span className="val">{sym}37</span></div>
            <div className="stack-row"><span className="label">&#10003; The Color Harmony Guide</span><span className="val">{sym}27</span></div>
            <div className="stack-row"><span className="label">&#10003; The Master Color Series: 10 Colored Mandalas</span><span className="val">{sym}79</span></div>
            <div className="stack-row" style={{ borderBottom: 'none' }}><span className="label" style={{ fontWeight: 700, color: 'var(--ink)' }}>Total Value</span><span className="val" style={{ fontSize: 16 }}>{sym}329</span></div>
          </section>

          <div className="checkout-box" style={{ maxWidth: 520, margin: '0 auto', padding: '40px 44px', borderRadius: 14, border: '2px solid rgba(45,74,143,0.25)', background: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div className="price-old">Normally {sym}97</div>
            <p className="now-only" style={{ fontSize: 44, color: 'var(--ink)', fontWeight: 700, marginBottom: 8 }}>Now Only <span style={{ color: '#2d4a8f' }}>{sym}47</span></p>
            <div className="price-note">One time payment. <span className="lifetime-break" />Lifetime access.</div>
            <div style={{ marginTop: 20 }}><CheckoutButton /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
              <p style={{ margin: 0, fontWeight: 500, fontSize: 16, whiteSpace: 'nowrap', color: 'var(--ink-muted)' }} className="guarantee-text">90 Day Money Back Guarantee</p>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
            </div>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 12, marginTop: 20 }}>&#128274; Secure payment &#128274;</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Image src="/visa.svg" alt="Visa" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/mastercard.svg" alt="Mastercard" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/american-express.svg" alt="Amex" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/discover.svg" alt="Discover" width={40} height={26} style={{ height: 26, width: 'auto' }} />
              <Image src="/paypal.svg" alt="PayPal" width={40} height={26} style={{ height: 26, width: 'auto' }} />
            </div>
            <div style={{ width: 48, height: 1, background: 'rgba(0,0,0,0.1)', margin: '20px auto' }} />
            <p className="ps-note">P.S. If the next page doesn&apos;t load... I&apos;m sorry, but the deal has ended!</p>
          </div>

          <div className="bonsai-divider" />


        </div>
      </div>

{/* FOOTER */}
      <footer className="bonsai-footer" style={{ paddingBottom: 100 }}>
        <p>&copy; 2026 Mandala Class. All rights reserved.</p>
        <p style={{ marginTop: 5 }}><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p>
        <p style={{ marginTop: 16, fontSize: 11, color: '#666', maxWidth: 600, margin: '16px auto 0', lineHeight: 1.5 }}>This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.</p>
      </footer>
    </main>
  );
}
