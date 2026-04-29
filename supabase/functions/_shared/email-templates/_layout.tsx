/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://evoriacoach.com/logo-email.png'
const SITE_URL = 'https://evoriacoach.com'

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export const EmailLayout = ({ preview, children }: LayoutProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Link href={SITE_URL}>
            <Img
              src={LOGO_URL}
              width="140"
              alt="Evoria Coach"
              style={logo}
            />
          </Link>
        </Section>

        <Section style={card}>{children}</Section>

        <Section style={footer}>
          <Img
            src={LOGO_URL}
            width="100"
            alt="Evoria Coach"
            style={footerLogo}
          />
          <Text style={footerText}>
            Evoria Coach App — seu software personalizado para te guiar ao corpo dos sonhos.
          </Text>
          <Text style={footerSmall}>
            © {new Date().getFullYear()} Evoria Coach ·{' '}
            <Link href={SITE_URL} style={footerLink}>
              evoriacoach.com
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: "'Inter', Arial, Helvetica, sans-serif",
  margin: 0,
  padding: '24px 0',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#0f0f0f',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #1f1f1f',
}
const header = {
  backgroundColor: '#000000',
  padding: '24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #1f1f1f',
}
const logo = { display: 'block', margin: '0 auto' }
const card = {
  padding: '32px 28px',
  color: '#e5e5e5',
}
const footer = {
  padding: '24px',
  textAlign: 'center' as const,
  backgroundColor: '#000000',
  borderTop: '1px solid #1f1f1f',
}
const footerLogo = { display: 'block', margin: '0 auto 12px', opacity: 0.85 }
const footerText = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '0 0 8px',
  lineHeight: '1.5',
}
const footerSmall = { fontSize: '11px', color: '#6b7280', margin: 0 }
const footerLink = { color: '#22c55e', textDecoration: 'none' }

// Shared inline styles for templates
export const styles = {
  h1: {
    fontSize: '24px',
    fontWeight: 700 as const,
    color: '#ffffff',
    margin: '0 0 16px',
    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
  },
  text: {
    fontSize: '15px',
    color: '#d1d5db',
    lineHeight: '1.6',
    margin: '0 0 16px',
  },
  button: {
    backgroundColor: '#22c55e',
    color: '#0a0a0a',
    fontSize: '15px',
    fontWeight: 600 as const,
    borderRadius: '10px',
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
    margin: '8px 0 24px',
  },
  link: { color: '#22c55e', textDecoration: 'underline' },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '24px 0 0',
    lineHeight: '1.5',
  },
  code: {
    fontSize: '28px',
    fontWeight: 700 as const,
    color: '#22c55e',
    letterSpacing: '6px',
    textAlign: 'center' as const,
    margin: '20px 0',
    fontFamily: 'monospace',
  },
}
