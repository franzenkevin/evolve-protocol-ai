/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout, styles } from './_layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <EmailLayout preview="Você foi convidado(a) — Evoria Coach">
    <Heading style={styles.h1}>Você foi convidado(a)!</Heading>
    <Text style={styles.text}>
      Você recebeu um convite para acessar a Evoria Coach. Clique no botão abaixo
      para aceitar e criar sua conta:
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Aceitar convite
    </Button>
    <Text style={styles.hint}>
      Se você não esperava este convite, pode ignorar este e-mail.
    </Text>
  </EmailLayout>
)

export default InviteEmail
