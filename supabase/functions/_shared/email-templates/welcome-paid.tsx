/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout, styles } from './_layout.tsx'

interface WelcomePaidProps {
  firstName?: string
  planName: string
  appUrl: string
}

export const WelcomePaidEmail = ({ firstName, planName, appUrl }: WelcomePaidProps) => (
  <EmailLayout preview="Bem-vindo(a) à Evoria Coach! Seu acesso está liberado 🎉">
    <Heading style={styles.h1}>
      {firstName ? `Bem-vindo(a), ${firstName}! 🎉` : 'Bem-vindo(a) à Evoria Coach! 🎉'}
    </Heading>
    <Text style={styles.text}>
      Seu pagamento foi confirmado e seu acesso ao <strong>{planName}</strong> está liberado.
      Agora começa sua transformação rumo ao corpo dos sonhos.
    </Text>
    <Text style={styles.text}>
      <strong>Próximos passos:</strong>
      <br />
      1. Faça o tutorial inicial para conhecer o app.
      <br />
      2. Confira sua avaliação corporal completa gerada pela IA.
      <br />
      3. Comece seu protocolo de treino e dieta personalizado.
    </Text>
    <Button style={styles.button} href={appUrl}>
      Acessar meu app
    </Button>
    <Text style={styles.hint}>
      Qualquer dúvida, é só responder este e-mail. Estamos com você nessa jornada! 💪
    </Text>
  </EmailLayout>
)

export default WelcomePaidEmail
