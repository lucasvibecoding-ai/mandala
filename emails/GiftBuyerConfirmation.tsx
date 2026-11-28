import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Preview,
  Link,
  Section,
} from '@react-email/components';

// The email to the BUYER of a gift (the person receiving it gets their own gift email).
interface GiftBuyerConfirmationProps {
  senderName?: string;
  recipientName?: string;
  recipientEmail?: string;
  // e.g. "on Fri, Dec 25 at 8:00 am, UK & Ireland (London) time"; empty when it went out right away.
  scheduledFor?: string;
  // Extras ticked at checkout, both inside the gift.
  extraCourse?: boolean;
  pack?: boolean;
  invoiceUrl?: string;
  // The site's materials page (Amazon links live there: Amazon doesn't allow them inside emails).
  materialsUrl?: string;
}

export default function GiftBuyerConfirmation({
  senderName,
  recipientName,
  recipientEmail,
  scheduledFor,
  extraCourse,
  pack,
  invoiceUrl,
  materialsUrl = 'https://mandalapractice.com/materials',
}: GiftBuyerConfirmationProps) {
  const them = recipientName?.trim() || 'them';
  const They = recipientName?.trim() || 'They';

  return (
    <Html>
      <Head />
      <Preview>Your gift is all set</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Your gift is all set</Heading>

          <Text style={text}>Hi {senderName?.trim() || 'there'},</Text>

          <>
              <Text style={text}>
                Thank you so much for your order. Your gift of the <strong>Mandala Masterclass</strong> for {them} is all set.
              </Text>

              <Section style={box}>
                <Text style={boxText}>
                  {scheduledFor ? (
                    <>We&apos;ll email it to <strong>{recipientEmail}</strong> {scheduledFor}.</>
                  ) : (
                    <>We&apos;ve just emailed it to <strong>{recipientEmail}</strong>.</>
                  )}
                </Text>
                <Text style={{ ...boxText, marginBottom: 0 }}>
                  It comes from hello@mandalapractice.com with your name and your message.
                </Text>
              </Section>

              {/* Owner 2026-11-23: tell the buyer the gift email can land in spam once it's sent. */}
              <Section style={spamBox}>
                <Text style={spamBoxHeading}>Please tell {them} to check the spam folder</Text>
                <Text style={{ ...spamBoxText, marginBottom: 0 }}>
                  Once the gift email is sent, it might end up in the spam or promotions folder. If {They === 'They' ? 'they' : They} can&apos;t find it, ask them to look there for an email from hello@mandalapractice.com and mark it as &quot;Not spam&quot;.
                </Text>
              </Section>
            </>

          {(extraCourse || pack) && (
            <Text style={text}>
              {extraCourse && (
                <>{They} can also pick <strong>any additional Aiko Arts course</strong> once they finish the Mandala Masterclass.{pack ? ' ' : ''}</>
              )}
              {pack && <>The <strong>Mandala Pack</strong> (150 printable mandalas) is inside the gift too.</>}
            </Text>
          )}

          <Section style={box}>
            <Text style={{ ...boxText, fontWeight: 700, color: '#1a1f3d' }}>Want something to wrap with it?</Text>
            <Text style={{ ...boxText, marginBottom: 0 }}>
              Good news: we provide Amazon links for all the materials {them} will need (under $30 together).{' '}
              <Link href={materialsUrl} style={{ color: '#2d4a8f' }}>See the list here</Link>.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={text}>
            If you run into any trouble, just reply to this email and I&apos;ll help you out.
          </Text>

          <Text style={signature}>Aiko</Text>

          {invoiceUrl && (
            <>
              <Hr style={divider} />
              <Text style={smallText}>
                Your invoice:{' '}
                <Link href={invoiceUrl} style={{ color: '#2d4a8f' }}>view or download it here</Link>.
              </Text>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: '#f8f6f3', fontFamily: "'Georgia', serif" };
const container = { margin: '0 auto', padding: '40px 24px', maxWidth: '560px' };
const heading = { fontSize: '24px', color: '#1a1f3d', marginBottom: '24px' };
const text = { fontSize: '16px', lineHeight: '1.7', color: '#4a4237', marginBottom: '16px' };
const box = { backgroundColor: '#ffffff', border: '1px solid #e8dfd2', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px' };
const boxText = { fontSize: '16px', lineHeight: '1.6', color: '#4a4237', margin: '0 0 8px' };
const spamBox = { backgroundColor: '#fdf3c7', border: '1px solid #f0d77a', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' };
const spamBoxHeading = { fontSize: '16px', fontWeight: '700' as const, color: '#1a1f3d', margin: '0 0 6px' };
const spamBoxText = { fontSize: '15px', lineHeight: '1.6', color: '#4a4237', margin: '0 0 8px' };
const smallText = { fontSize: '14px', lineHeight: '1.6', color: '#7d7568', marginBottom: '12px' };
const divider = { borderColor: '#d9cfc0', margin: '28px 0' };
const signature = { fontSize: '16px', lineHeight: '1.7', color: '#4a4237', marginTop: '8px' };
