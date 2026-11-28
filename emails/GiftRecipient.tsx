import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Preview,
  Button,
  Img,
  Section,
} from '@react-email/components';

// The gift email to the person RECEIVING the gift, sent now or at the day/hour the buyer chose.
// Subject: "<From> sent you a gift: the Mandala Masterclass". Never shows the price.
// Look (owner 2026-11-23, "cleaner and more cool"): one dark gift card with gold accents, the
// buyer's note up top, one button; extras and a short sign-off below.
interface GiftRecipientProps {
  recipientName?: string;
  senderName: string;
  message?: string;
  // The one-use gift link: they choose their own email + password and the course is theirs.
  giftUrl: string;
  extraCourse?: boolean;
  pack?: boolean;
  // Where the pictures live (the live site; a JPG copy of the hero is better for Outlook).
  siteUrl?: string;
}

export default function GiftRecipient({
  recipientName,
  senderName,
  message,
  giftUrl,
  extraCourse,
  pack,
  siteUrl = 'https://mandalapractice.com',
}: GiftRecipientProps) {
  const name = recipientName?.trim();
  const note = message?.trim();
  return (
    <Html>
      <Head />
      <Preview>{`${senderName} sent you a gift: the Mandala Masterclass`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={card}>
            <Text style={eyebrow}>{`FROM ${senderName.toUpperCase()}`}</Text>
            <Heading style={headline}>{name ? `A gift for you, ${name}` : 'A gift for you'}</Heading>

            {note && (
              <>
                <Text style={quoteMark}>&ldquo;</Text>
                <Text style={quote}>{note}</Text>
              </>
            )}

            <Img src={`${siteUrl}/hero.webp`} alt="The Mandala Masterclass" width="300" style={hero} />

            <Text style={course}>The Mandala Masterclass</Text>
            <Text style={tagline}>Draw your first mandala in 2 hours, even as a complete beginner.</Text>

            <Button href={giftUrl} style={button}>Open your gift &rarr;</Button>
            <Text style={fine}>Pick your own email and password. It&apos;s yours for life.</Text>
          </Section>

          {(extraCourse || pack) && (
            <Section style={extras}>
              <Text style={extrasTitle}>ALSO INSIDE YOUR GIFT</Text>
              {extraCourse && <Text style={extrasLine}>&#10022;&nbsp; One more Aiko Arts course of your choice, after the Mandala Masterclass</Text>}
              {pack && <Text style={extrasLine}>&#10022;&nbsp; The Mandala Pack: 150 printable mandalas</Text>}
            </Section>
          )}

          <Text style={signoff}>Questions? Just reply to this email.</Text>
          <Text style={signature}>Aiko</Text>
          <Text style={footnote}>Add hello@mandalapractice.com to your contacts so your course emails reach your inbox.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const NAVY = '#141a33';
const GOLD = '#d4a574';
const CREAM = '#f6efe4';

const body = { backgroundColor: '#efe9df', fontFamily: "'Georgia', 'Times New Roman', serif", margin: 0 };
const container = { margin: '0 auto', padding: '36px 16px 40px', maxWidth: '560px' };
const card = { backgroundColor: NAVY, borderRadius: '22px', padding: '44px 44px 40px', textAlign: 'center' as const };
const eyebrow = { color: GOLD, fontSize: '12px', letterSpacing: '4px', fontWeight: '700' as const, margin: '0 0 14px' };
const headline = { color: CREAM, fontSize: '34px', lineHeight: '1.2', fontWeight: '400' as const, margin: '0 0 22px' };
const quoteMark = { color: GOLD, fontSize: '56px', lineHeight: '0.6', margin: '8px 0 6px', fontFamily: "'Georgia', serif" };
const quote = { color: '#d9d4ea', fontSize: '17px', fontStyle: 'italic' as const, lineHeight: '1.65', margin: '0 auto 30px', maxWidth: '400px' };
const hero = { width: '300px', maxWidth: '100%', height: 'auto', borderRadius: '14px', display: 'block', margin: '0 auto 26px' };
const course = { color: CREAM, fontSize: '24px', fontWeight: '400' as const, margin: '0 0 6px' };
const tagline = { color: '#a9adc4', fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px' };
const button = { backgroundColor: GOLD, color: NAVY, padding: '16px 40px', borderRadius: '999px', fontSize: '17px', fontWeight: '700' as const, textDecoration: 'none', display: 'inline-block' };
const fine = { color: '#8b90aa', fontSize: '13px', margin: '16px 0 0' };
const extras = { padding: '26px 8px 4px', textAlign: 'center' as const };
const extrasTitle = { color: '#a07a52', fontSize: '11px', letterSpacing: '3px', fontWeight: '700' as const, margin: '0 0 10px' };
const extrasLine = { color: '#4a4237', fontSize: '15px', lineHeight: '1.6', margin: '0 0 6px' };
const signoff = { color: '#6f675c', fontSize: '15px', textAlign: 'center' as const, margin: '30px 0 2px' };
const signature = { color: '#1a1f3d', fontSize: '18px', fontStyle: 'italic' as const, textAlign: 'center' as const, margin: '0 0 22px' };
const footnote = { color: '#a39b8f', fontSize: '12px', lineHeight: '1.6', textAlign: 'center' as const, margin: 0 };
