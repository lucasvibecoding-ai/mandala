import Reviews from '../Reviews';
import type { Metadata } from "next";
import Image from "next/image";
import CheckoutButton from "../CheckoutButton";
import FaqAccordion from "../FaqAccordion";
import GiftBar from "./GiftBar";
import GiftCard from "./GiftCard";
import { headers } from "next/headers";
import { currencyForCountry, currencySymbol } from "../../lib/pricing";

export const metadata: Metadata = {
  title: "Mandala Masterclass: Gift Someone You Love A Calm New Hobby",
  description:
    "Give someone you love a calm new hobby. The Mandala Masterclass arrives by email on the day and hour you choose. No shipping, nothing to wrap.",
};

// The giver's questions. The course questions stay on the main page.
const GIFT_FAQS = [
  {
    q: 'Can I choose when the gift arrives?',
    a: "Yes. At checkout you pick the day, the hour, and their timezone, and the gift email arrives right then. Christmas morning, a birthday, or straight away. It's your choice.",
  },
  {
    q: 'Do they need an account or my email address?',
    a: "No. When they open the gift, they choose their own email and password, and the course is theirs. If they already have an Aiko Arts account, the course is simply added to it.",
  },
  {
    q: 'Will they see what I paid?',
    a: "No. The gift email shows your name and your message, never the price. Your receipt only goes to you.",
  },
  {
    q: 'Is anything shipped?',
    a: "No. This is an online video course, so nothing arrives by post. If you'd like something to unwrap, wrap a few pens and a pad of paper (see the list above). Everything they need costs under $30.",
  },
  {
    q: 'Can I send it to someone in another country?',
    a: "Yes. The course works anywhere in the world. Pick their timezone at checkout so the email lands at a nice hour for them.",
  },
  {
    q: 'Does the gift expire?',
    a: "No. They can open it whenever they're ready, and once it's theirs they keep lifetime access to every lesson.",
  },
  {
    q: "What if it's not right for them?",
    a: "You're covered by the 90 day money-back guarantee. Email hello@mandalapractice.com and you get a full refund. No questions asked.",
  },
  {
    q: 'Can I give it to more than one person?',
    a: "Yes. Place one order per person, so each of them gets their own gift and their own login.",
  },
];

export default async function GiftPage() {
  const sym = currencySymbol(
    currencyForCountry((await headers()).get("x-vercel-ip-country"))
  );
  const priceBox = (id?: string) => (
    <div id={id} className="checkout-box" style={{ maxWidth: 520, margin: '0 auto', padding: '40px 44px', borderRadius: 14, border: '2px solid rgba(199,145,91,0.45)', background: '#ffffff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
      <div className="price-old price-value">A {sym}97 value</div>
      <p className="now-only" style={{ fontSize: 44, color: 'var(--ink)', fontWeight: 700, marginBottom: 8 }}>Gift it for <span style={{ color: '#2d4a8f' }}>{sym}49.99</span></p>
      <div className="price-note">One time payment. <span className="lifetime-break" />Lifetime access for them.</div>
      <div style={{ marginTop: 20 }}><CheckoutButton href="/checkout?gift=1" label={<>Give This Gift</>} /></div>
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
      </div>
      <p className="ps-note" style={{ marginTop: 20 }}>You choose the day it arrives on the next page.</p>
    </div>
  );

  return (
    <main className="overflow-hidden">
      <GiftBar />

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
        /* "A $97 value" (owner 2026-11-10): a value line, not a struck former price (EU rule). */
        .price-old.price-value { text-decoration: none; font-size: 24px; font-weight: 600; letter-spacing: .01em; }
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

      <style dangerouslySetInnerHTML={{ __html: `
        /* GIFT PAGE */
        .gift-chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 26px; }
        .gift-chip { display: inline-flex; align-items: center; gap: 8px; font-size: 16px; padding: 8px 16px; border: 1px solid var(--sand); border-radius: 100px; background: var(--cream); color: var(--ink); line-height: 1.3; }
        .gift-chip b { color: var(--gold); font-weight: 700; }
        .gift-hero-img { position: relative; width: 90%; max-width: 640px; aspect-ratio: 1/1; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(26,45,107,0.3), 0 4px 12px rgba(0,0,0,0.1); }
        .gift-tag { position: absolute; left: 7%; bottom: 8%; background: #fff; border-radius: 10px; padding: 14px 22px 14px 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.22); transform: rotate(-4deg); text-align: left; }
        .gift-tag::before { content: ''; position: absolute; left: 11px; top: 50%; width: 9px; height: 9px; margin-top: -4.5px; border-radius: 50%; border: 2px solid var(--gold); }
        .gift-tag p { margin: 0 !important; line-height: 1.35; }
        .gift-tag .t1 { font-size: 14px; color: var(--ink-muted); letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700; }
        .gift-tag .t2 { font-size: 22px; color: var(--ink); font-style: italic; font-weight: 600; }
        .gift-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .gift-step { background: var(--card); border: 1px solid var(--sand); border-radius: 14px; padding: 26px 24px; }
        .gift-step-num { width: 42px; height: 42px; border-radius: 50%; background: var(--gold-pale); border: 1.5px solid var(--gold); color: var(--gold); font-weight: 700; font-size: 19px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .gift-step h3 { font-size: 22px !important; color: var(--ink) !important; margin-bottom: 8px; }
        .gift-step p { font-size: 17px; color: var(--ink-muted); margin: 0; line-height: 1.6; }
        .gift-two { display: flex; gap: 48px; align-items: center; }
        .gift-two > div { flex: 1; }
        .gift-list { list-style: none; padding: 0; margin: 0 0 20px; }
        .gift-list li { padding: 8px 0 8px 34px; position: relative; font-size: 19px; line-height: 1.55; }
        .gift-list li::before { content: '\\2713'; position: absolute; left: 0; top: 8px; color: var(--gold); font-weight: 700; }
        .gift-for p { margin-bottom: 22px; }
        .gift-section-bg { background: var(--bg-warm); border-radius: 20px; padding: 56px 48px !important; }
        @media (max-width: 860px) {
          .gift-steps { grid-template-columns: 1fr; }
          .gift-two { flex-direction: column; gap: 32px; }
          .gift-section-bg { padding: 40px 22px !important; border-radius: 14px; }
        }
        @media (max-width: 480px) {
          .gift-hero-img { width: 100%; }
          .gift-tag { padding: 10px 16px 10px 26px; }
          .gift-tag .t2 { font-size: 18px; }
          .gift-chip { font-size: 14px; }
        }
      `}} />

      <div className="bonsai-page">
        <div className="container">

          {/* HERO */}
          <section style={{ paddingTop: 56, paddingBottom: 40, textAlign: 'center' }}>
            <p className="no-exp" style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>For The First Time Online</p>
            <h1><span style={{ background: 'linear-gradient(135deg, #2d4a8f, #4a6db5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 4px rgba(45,74,143,0.2))' }}>Mandala Masterclass:</span> Gift Someone You Love A Calm New Hobby</h1>
            <p className="hero-sub" style={{ color: 'var(--ink-muted)', marginTop: 8, fontStyle: 'italic', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>They draw their first mandala in 2 hours, even as a complete beginner.</p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
              <div className="gift-hero-img">
                <Image src="/hero.webp" alt="A mandala drawn in the Mandala Masterclass" fill style={{ objectFit: 'cover' }} priority />
                <div className="gift-tag">
                  <p className="t1">A gift for</p>
                  <p className="t2">someone special</p>
                </div>
              </div>
            </div>

            <div className="gift-chips">
              <span className="gift-chip"><b>&#10003;</b> Arrives by email on the day you pick</span>
              <span className="gift-chip"><b>&#10003;</b> Nothing to ship or wrap</span>
              <span className="gift-chip"><b>&#10003;</b> Theirs for life</span>
            </div>
          </section>

          {/* PERFECT FOR */}
          <section className="gift-for" style={{ padding: '48px 0' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 48 }}>The perfect gift for...</h2>
            <div style={{ maxWidth: 680, margin: '0 auto', fontSize: 20 }}>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; Someone who loves coloring books.</span> Mandalas are the next step: they stop filling in someone else&apos;s design and start drawing their own.</p>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; A friend who never takes time for themselves.</span> An hour of quiet focus with a pen and paper, away from every screen except the lesson.</p>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; A parent or grandparent with time for a new hobby.</span> Clear step-by-step videos at their own pace. No experience needed.</p>
              <p><span style={{ color: 'var(--accent)', fontWeight: 700 }}>&rarr; Anyone who says &quot;I can&apos;t draw.&quot;</span> The geometry does the work. If they can sign their name, they can do this.</p>
            </div>
          </section>

          {/* WHAT THEY'LL MAKE */}
          <section style={{ padding: '24px 0 40px' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 32 }}>What they&apos;ll learn to draw</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="fillpic-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
                  <Image src={`/fill_pic${n}.webp`} alt={`Mandala example ${n}`} fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </section>

          {/* HOW THE GIFT WORKS */}
          <section style={{ padding: '48px 0 40px' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 36 }}>How the gift works</h2>
            <div className="gift-steps">
              <div className="gift-step">
                <div className="gift-step-num">1</div>
                <h3>You choose the moment</h3>
                <p>At checkout, add their email, a short message, and the day and hour it should arrive in their timezone. Or send it straight away.</p>
              </div>
              <div className="gift-step">
                <div className="gift-step-num">2</div>
                <h3>They get a gift email</h3>
                <p>With your name and your message, right on time. Christmas morning, a birthday, or straight away.</p>
              </div>
              <div className="gift-step">
                <div className="gift-step-num">3</div>
                <h3>They open it and start</h3>
                <p>They choose their own email and password, and the course is theirs for life. Short videos they can watch on a phone, tablet, or computer.</p>
              </div>
            </div>
          </section>

          {/* WHAT THEY RECEIVE */}
          <section style={{ padding: '40px 0 56px' }}>
            <div className="gift-two">
              <div>
                <h2 style={{ marginBottom: 20 }}>This is what lands in their inbox.</h2>
                <p>A gift email with <strong>your name and your own message</strong>, sent on the exact day and hour you chose, in their timezone.</p>
                <p style={{ marginBottom: 0 }}>One tap on &quot;Open your gift&quot;, they pick an email and a password, and they&apos;re inside the course. <strong>The price never shows.</strong></p>
              </div>
              <div>
                <GiftCard />
              </div>
            </div>
          </section>

          {/* SOMETHING TO UNWRAP */}
          <section className="gift-section-bg" style={{ margin: '40px 0' }}>
            <div className="gift-two">
              <div>
                <div style={{ position: 'relative', width: '100%', maxWidth: 460, aspectRatio: '1/1', margin: '0 auto', borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 40px rgba(26,45,107,0.2)' }}>
                  <Image src="/materials.webp" alt="Fineliner pens, a compass, a drawing pad, a pencil and a ruler on a wooden table" fill style={{ objectFit: 'cover' }} />
                </div>
              </div>
              <div>
                <h2 style={{ marginBottom: 20 }}>Want something to put under the tree?</h2>
                <p>Wrap the few things they&apos;ll need, and the gift email does the rest:</p>
                <ul className="gift-list">
                  <li>A set of fineliner pens</li>
                  <li>A compass</li>
                  <li>A pad of drawing paper</li>
                  <li>A pencil and a ruler</li>
                </ul>
                <p>All together it&apos;s <strong>under {sym}30</strong> at any stationery shop, and they can start the moment they open the gift email.</p>
                <p style={{ marginBottom: 0 }}><strong>Good news: we provide Amazon links for all of them.</strong></p>
              </div>
            </div>
          </section>

          {/* INSTRUCTOR */}
          <section className="instructor">
            <div className="instructor-img">
              <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                <Image src="/creator.webp" alt="Aiko" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div className="instructor-text">
              <h2>My name is Aiko.</h2>
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

          {/* REVIEWS */}
          <Reviews />

          {/* CTA */}
          <section style={{ padding: '56px 0' }}>
            <div className="bonsai-center" style={{ marginBottom: 32 }}>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>Most gifts get used once. This one gives them a quiet hour they can come back to for years.</p>
              <p style={{ maxWidth: 720, textAlign: 'left', fontSize: 24, margin: '0 auto 20px' }}>It&apos;s one payment of <strong>{sym}49.99</strong>, with lifetime access to every lesson and every bonus. You choose when it arrives.</p>
            </div>
            {priceBox('give')}
          </section>

          {/* GUARANTEE */}
          <section className="guarantee-section">
            <Image src="/guarantee1.webp" alt="90 Day Money Back Guarantee" width={160} height={160} style={{ width: 130, height: 130, marginBottom: 16, margin: '0 auto 16px', display: 'block' }} />
            <h2 style={{ textAlign: 'center' }}>If they don&apos;t love it, you get your money back</h2>
            <p style={{ textAlign: 'left', fontSize: 20 }}>Gifts are a guess, so this one is risk-free. If the course isn&apos;t right for them, email hello@mandalapractice.com within 90 days and you get a full refund. Within 24 hours. <strong>No questions asked.</strong></p>
          </section>

          {/* BONUSES */}
          <section style={{ padding: '36px 0' }}>
            <p className="bonsai-center" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>But wait, there&apos;s more</p>
            <h2 className="bonsai-center" style={{ marginBottom: 24 }}>Order today and they also get:</h2>

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

          {/* MEGA BONUS */}
          <section style={{ padding: '64px 0 64px' }}>
            <p className="bonsai-center" style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>One last thing...</p>
            <h2 className="bonsai-center" style={{ marginBottom: 18 }}>And they also get:</h2>

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

          {/* EVERYTHING THEY GET */}
          <section style={{ padding: '36px 0' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 18 }}>Everything they get:</h2>
            <div className="stack-row stack-total"><span className="label">&#10003; 5 Core Modules</span><span className="val">{sym}139</span></div>
            <div className="stack-row"><span className="label">&#10003; 10 Printable Mandala Templates</span><span className="val">{sym}47</span></div>
            <div className="stack-row"><span className="label">&#10003; The Intention Series: 10 Ritual Templates</span><span className="val">{sym}37</span></div>
            <div className="stack-row"><span className="label">&#10003; The Color Harmony Guide</span><span className="val">{sym}27</span></div>
            <div className="stack-row"><span className="label">&#10003; The Master Color Series: 10 Colored Mandalas</span><span className="val">{sym}79</span></div>
            <div className="stack-row" style={{ borderBottom: 'none' }}><span className="label" style={{ fontWeight: 700, color: 'var(--ink)' }}>Total Value</span><span className="val" style={{ fontSize: 16 }}>{sym}329</span></div>
          </section>

          <div className="bonsai-divider" />

          {/* GIFT FAQ */}
          <section style={{ padding: '40px 0' }}>
            <h2 className="bonsai-center" style={{ marginBottom: 24 }}>Questions about the gift</h2>
            <FaqAccordion items={GIFT_FAQS} />
          </section>

          <div className="bonsai-divider" />

          <section style={{ padding: '48px 0 24px' }}>
            {priceBox()}
          </section>

          <div className="bonsai-divider" />

        </div>
      </div>

      <footer className="bonsai-footer" style={{ paddingBottom: 100 }}>
        <p>&copy; 2026 Mandala Class. All rights reserved.</p>
        <p style={{ marginTop: 5 }}><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p>
        <p style={{ marginTop: 16, fontSize: 11, color: '#666', maxWidth: 600, margin: '16px auto 0', lineHeight: 1.5 }}>This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.</p>
      </footer>
    </main>
  );
}
