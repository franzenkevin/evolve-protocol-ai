/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Link } from 'npm:@react-email/components@0.0.22'
import { EmailLayout, styles } from './_layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <EmailLayout preview="Redefinir sua senha — Evoria Coach">
    <Heading style={styles.h1}>Redefinir sua senha</Heading>
    <Text style={styles.text}>
      Recebemos uma solicitação para redefinir a senha da sua conta na Evoria Coach.
      Clique no botão abaixo para criar uma nova senha:
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Redefinir senha
    </Button>
    <Text style={styles.text}>
      Ou copie este link:
      <br />
      <Link href={confirmationUrl} style={styles.link}>{confirmationUrl}</Link>
    </Text>
    <Text style={styles.hint}>
      Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
    </Text>
  </EmailLayout>
)

export default RecoveryEmail
