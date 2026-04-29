/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout, styles } from './_layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <EmailLayout preview="Confirme seu novo e-mail — Evoria Coach">
    <Heading style={styles.h1}>Confirme seu novo e-mail</Heading>
    <Text style={styles.text}>
      Recebemos uma solicitação para alterar o e-mail da sua conta de
      <strong> {email}</strong> para <strong>{newEmail}</strong>.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Confirmar novo e-mail
    </Button>
    <Text style={styles.hint}>
      Se você não fez essa solicitação, ignore este e-mail.
    </Text>
  </EmailLayout>
)

export default EmailChangeEmail
