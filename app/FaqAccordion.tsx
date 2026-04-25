'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Do I need any experience with drawing or sacred geometry?',
    a: "None at all. This course is built for complete beginners, including people who've never held a compass. Module 1 starts with the fundamentals of mandala art and walks you through your very first drawing step by step.",
  },
  {
    q: 'How much does everything cost to get started?',
    a: "Under $30 total. A beginner fineliner set ($10 to $15), a quality compass ($8 to $12), and a pad of cartridge paper ($5 to $10). The course includes a complete shopping guide with links. You do NOT need expensive specialty supplies.",
  },
  {
    q: 'Will you tell me which materials to buy and where to get them?',
    a: "Yes. Module 2 walks you through exactly which materials to start with based on the mandalas you want to draw first. It also includes a shopping guide with specific links so you know exactly where to buy everything and what to avoid.",
  },
  {
    q: 'What materials do I need for my first mandala?',
    a: "Everything you need costs under $30. A basic starter kit includes: a set of fineliner pens, a compass, a ruler, a pad of cartridge or Bristol paper, and a pencil. Module 2 covers exactly what to buy and where.",
  },
  {
    q: 'Can I do this in a small apartment?',
    a: "Absolutely. All you need is a desk or kitchen table and a flat surface. No studio, no workshop, no special equipment. Most of our students draw at their kitchen table. You can even do it on a lap desk.",
  },
  {
    q: 'Will this work with materials available in my country?',
    a: "Yes. The materials used in this course are available worldwide through online retailers. Fineliner sets, compasses, and drawing paper ship internationally, and most other supplies are available anywhere. The course covers alternatives for hard-to-find items.",
  },
  {
    q: 'How much time does a mandala take?',
    a: "Your first mandala takes about 1 to 2 hours from setup to finished. Setting up the grid takes 10 to 15 minutes, drawing the rings and motifs takes 45 to 90 minutes, and shading plus signing takes another 5 to 10 minutes. It's one of the most rewarding creative hobbies for the time invested.",
  },
  {
    q: 'How long until my work looks like the stunning pieces I see online?',
    a: "Your very first mandala will have that signature sacred geometry look. That happens in under two hours. The beauty comes from the symmetry, not years of practice. The initial \"wow\" moment is immediate. Every mandala after that just gets more refined.",
  },
  {
    q: "I'm not artistic at all. Can I still do this?",
    a: "Mandala art is fundamentally different from realistic drawing. The images are created by a handful of repeating motifs on a symmetry grid, not by detailed sketching. If you can sign your name, you can create stunning mandalas. The geometry does the artistry for you.",
  },
  {
    q: 'What if my first mandala doesn\'t turn out well?',
    a: "The Troubleshooting Guide covers every common mistake so you can fix almost any issue on your next mandala. But honestly, even imperfect mandalas look beautiful. That's the magic of this art form. The symmetry hides most mistakes, and each piece is unique. With paper costing a few cents a sheet, a learning experience is never a disaster.",
  },
  {
    q: "What's the refund policy?",
    a: "90-day money-back guarantee. Try the entire course. Get your materials. Draw your first mandala. If you don't love it, email us within 90 days and we'll refund you in full. No questions asked. No hoops.",
  },
  {
    q: 'How is the content delivered?',
    a: "Instant access to our private course platform. All video lessons and downloadable PDFs organized by module. Watch on any device: phone, tablet, or computer. Lifetime access, so go at your own pace. There's no schedule and no expiration.",
  },
  {
    q: 'Is it safe to purchase online?',
    a: "Yes. Payments are processed through Stripe, the same secure payment platform used by millions of businesses worldwide (including Amazon, Google, and Shopify). We never see your card details.",
  },
  {
    q: 'Are the inks and pens safe to use?',
    a: "Yes. The fineliner pens used in this course are non-toxic and meet international safety standards. They can temporarily mark your fingers if you grip the tip, but it washes off easily with soap and water. There are no harsh chemicals involved. Perfectly safe for use at home, including at a kitchen table.",
  },
  {
    q: 'Have a specific question?',
    a: "Email us at hello@mandalapractice.com and we'll get back to you as soon as possible.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {faqs.map((faq, i) => (
        <div key={i} className="faq-item">
          <button
            className="faq-q"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            type="button"
          >
            <span className="faq-q-text">{faq.q}</span>
            <span className={`faq-icon ${openIndex === i ? 'open' : ''}`}>+</span>
          </button>
          <div className={`faq-answer ${openIndex === i ? 'open' : ''}`}>
            <div className="faq-answer-inner">
              <p className="faq-a">{faq.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
