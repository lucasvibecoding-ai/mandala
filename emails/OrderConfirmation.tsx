import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Preview,
} from '@react-email/components';

interface OrderConfirmationProps {
  customerEmail: string;
}

export default function OrderConfirmation({ customerEmail }: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Important update about your course purchase</Preview>
      <Body style={body}>
        <Container style={container}>

          <Heading style={heading}>Thank you for your purchase</Heading>

          <Text style={text}>
            Hi there,
          </Text>

          <Text style={text}>
            I wanted to personally reach out about your recent purchase. First, thank you so much, it genuinely means a lot.
          </Text>

          <Text style={text}>
            Here&apos;s what&apos;s happening: based on student feedback, the course is currently being rebuilt and expanded to give you even more value. I want to make sure what you get is worth every penny.
          </Text>

          <Text style={text}>
            <strong>You will not be charged anything extra.</strong>
          </Text>

          <Text style={optionText}>
            The updated version is already in production and goes live <strong>May 12th</strong>. It&apos;s going to be incredible. As a thank you for your patience, I&apos;ll give you a <strong>steep discount</strong> on our private community once it opens. It&apos;s going to be a space for mandala enthusiasts, and you&apos;ll get in at a fraction of the price.
          </Text>

          <Hr style={divider} />

          <Text style={text}>
            I&apos;ll send you access as soon as the updated version is live. No need to do anything on your end &mdash; just sit tight.
          </Text>

          <Text style={signature}>
            Aiko Mori
          </Text>

          <Hr style={divider} />

          <Text style={spamHeading}>
            Make sure my emails actually reach you
          </Text>

          <Text style={spamText}>
            Email providers like Gmail, Yahoo, and Outlook sometimes decide that emails you actually want are spam. Here&apos;s how to make sure that never happens with my emails:
          </Text>

          <Text style={spamStep}>
            <strong>1. Reply to this email.</strong> Even just &quot;Ok&quot; works. Doing this once tells your email provider you know me, and it&apos;s often all you need.
          </Text>

          <Text style={spamStep}>
            <strong>2. Add me to your contacts.</strong> Save <strong>hello@mandalapractice.com</strong> as a contact and future emails will go straight to your inbox.
          </Text>

          <Text style={spamStep}>
            <strong>3. Mark as &quot;Not spam&quot; if needed.</strong> If this email landed in spam or promotions, move it to your inbox and click &quot;Not spam&quot; / &quot;Not promotions&quot;. That trains the filter for next time.
          </Text>

          <Text style={spamText}>
            Takes 30 seconds and saves a lot of missed emails down the line.
          </Text>

        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#f8f6f3',
  fontFamily: "'Georgia', serif",
};

const container = {
  margin: '0 auto',
  padding: '40px 24px',
  maxWidth: '560px',
};

const heading = {
  fontSize: '24px',
  color: '#1a1f3d',
  marginBottom: '24px',
};

const text = {
  fontSize: '16px',
  lineHeight: '1.7',
  color: '#4a4237',
  marginBottom: '16px',
};

const optionText = {
  fontSize: '16px',
  lineHeight: '1.7',
  color: '#4a4237',
  marginBottom: '16px',
  paddingLeft: '16px',
  borderLeft: '3px solid #2d4a8f',
};

const divider = {
  borderColor: '#d9cfc0',
  margin: '28px 0',
};

const signature = {
  fontSize: '16px',
  lineHeight: '1.7',
  color: '#4a4237',
  marginTop: '8px',
};

const spamHeading = {
  fontSize: '15px',
  fontWeight: '700' as const,
  color: '#1a1f3d',
  marginBottom: '8px',
};

const spamText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#7d7568',
  marginBottom: '12px',
};

const spamStep = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#7d7568',
  marginBottom: '10px',
  paddingLeft: '12px',
};
