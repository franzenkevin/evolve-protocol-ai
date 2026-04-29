/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Link } from 'npm:@react-email/components@0.0.22'
import { EmailLayout, styles } from './_layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailLayout preview="Confirme seu e-mail na Evoria Coach">
    <Heading style={styles.h1}>Bem-vindo(a) à Evoria Coach! 💪</Heading>
    <Text style={styles.text}>
      Obrigado por criar sua conta. Para começar sua jornada rumo ao corpo dos sonhos,
      confirme seu e-mail clicando no botão abaixo:
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Confirmar meu e-mail
    </Button>
    <Text style={styles.text}>
      Ou copie este link no seu navegador:
      <br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <Text style={styles.hint}>
      Esta confirmação foi enviada para <strong>{recipient}</strong>. Se você não criou
      uma conta na Evoria Coach, pode ignorar este e-mail com segurança.
    </Text>
  </EmailLayout>
)

export default SignupEmail
