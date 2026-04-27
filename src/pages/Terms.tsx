import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center gap-3 h-12 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-heading font-semibold text-foreground text-sm">Termos de Uso & Política de Privacidade</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-48px)]">
        <div className="p-4 max-w-lg mx-auto pb-12 text-sm text-secondary-foreground space-y-5 leading-relaxed">

          {/* === BLOCO 1 — TERMO SAAS === */}
          <section>
            <h2 className="text-lg font-heading font-bold text-foreground mb-2">
              1. Termo de Uso da Plataforma (SaaS)
            </h2>
            <p>
              O <strong>EVORIA</strong> é um software disponibilizado como serviço (SaaS — <em>Software as a Service</em>) acessado
              via internet. Ao criar uma conta, contratar um plano ou utilizar qualquer funcionalidade do Aplicativo, você declara que
              <strong> leu, compreendeu e concorda integralmente</strong> com todas as cláusulas abaixo. Caso não concorde com qualquer item, NÃO
              utilize o serviço.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.1 Natureza do Serviço — Software Automatizado</h3>
            <p>
              O EVORIA é uma <strong>plataforma totalmente automatizada</strong> que utiliza algoritmos próprios e modelos de inteligência
              artificial (IA) de terceiros para gerar protocolos de treino, dieta, cardio, mobilidade e recomendações de evolução. Os
              protocolos são <strong>gerados por software</strong>, sem intervenção humana individualizada em tempo real, salvo se contratado
              expressamente um pacote de acompanhamento humano em separado. O usuário reconhece e aceita que está contratando o uso de
              uma <strong>ferramenta tecnológica</strong>, e não a prestação de serviços médicos, nutricionais, de educação física ou de
              fisioterapia personalizados.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.2 Ausência de Garantia de Resultado</h3>
            <p>
              O EVORIA <strong>NÃO garante qualquer resultado específico</strong> — incluindo, mas não se limitando a: ganho de massa
              muscular, perda de gordura, melhora estética, performance esportiva, melhora de exames clínicos, longevidade ou qualquer
              outra métrica de saúde. Os resultados dependem de inúmeros fatores fora do controle da plataforma, como genética, adesão do
              usuário ao protocolo, sono, estresse, condições hormonais, alimentação real, ambiente, lesões prévias e variabilidade
              biológica individual. As referências, exemplos, depoimentos e materiais de marketing têm caráter <strong>meramente
              ilustrativo</strong> e não constituem promessa contratual de resultado.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.3 Não Substituição de Profissional Habilitado</h3>
            <p>
              O EVORIA <strong>NÃO substitui</strong>, em nenhuma hipótese, a avaliação, prescrição, diagnóstico ou acompanhamento de:
              médico (CRM), nutricionista (CRN), educador físico (CREF), fisioterapeuta (CREFITO), psicólogo ou qualquer outro
              profissional de saúde legalmente habilitado. As informações e protocolos fornecidos têm caráter
              <strong> educacional e de orientação geral</strong>. O usuário se compromete a:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Realizar avaliação médica prévia antes de iniciar qualquer programa de exercícios ou dieta;</li>
              <li>Informar imediatamente seu médico sobre os protocolos sugeridos pela plataforma;</li>
              <li>Não substituir tratamento médico em curso por sugestões da IA;</li>
              <li>Não interromper medicação, suplementação prescrita ou terapia em razão do conteúdo do app sem orientação profissional.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.4 Uso por Conta e Risco do Usuário</h3>
            <p>
              O usuário utiliza o EVORIA <strong>por sua exclusiva conta e risco</strong>. É de inteira responsabilidade do usuário:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Avaliar previamente sua aptidão física e médica para executar treinos e dietas;</li>
              <li>Adaptar a intensidade, carga e volume conforme sua percepção e limites;</li>
              <li>Interromper imediatamente qualquer exercício em caso de dor, tontura, falta de ar ou desconforto anormal;</li>
              <li>Verificar compatibilidade dos alimentos sugeridos com suas alergias, intolerâncias e condições clínicas;</li>
              <li>Fornecer informações verdadeiras, atualizadas e precisas no onboarding e check-ins;</li>
              <li>Não utilizar a plataforma sob efeito de substâncias que comprometam o discernimento;</li>
              <li>Manter ambiente seguro durante a execução dos treinos.</li>
            </ul>
            <p className="mt-2">
              <strong>Informações falsas, incompletas ou desatualizadas</strong> fornecidas pelo usuário podem resultar em protocolos
              inadequados — a responsabilidade por tais consequências é exclusivamente do usuário.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.5 Limitação de Responsabilidade</h3>
            <p>
              Na máxima extensão permitida pela legislação brasileira, o EVORIA, seus sócios, administradores, funcionários,
              parceiros e fornecedores <strong>NÃO se responsabilizam</strong> por quaisquer danos diretos, indiretos, incidentais, especiais,
              consequenciais, lucros cessantes ou morais decorrentes de:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Lesões físicas, problemas musculoesqueléticos, articulares ou cardiovasculares;</li>
              <li>Reações alérgicas, intolerâncias, intoxicações ou problemas digestivos;</li>
              <li>Alterações hormonais, metabólicas ou de exames clínicos;</li>
              <li>Resultados estéticos diferentes do esperado;</li>
              <li>Decisões tomadas pelo usuário com base no conteúdo do aplicativo;</li>
              <li>Indisponibilidade temporária do serviço, falhas de internet, erros da IA, perda de dados ou interrupções programadas;</li>
              <li>Uso indevido, não autorizado ou contrário a estes termos.</li>
            </ul>
            <p className="mt-2">
              <strong>Limite máximo de indenização:</strong> caso, mesmo após as exclusões acima, sobrevenha decisão judicial reconhecendo
              responsabilidade da plataforma, a indenização total fica <strong>limitada ao valor efetivamente pago pelo usuário nos últimos
              12 (doze) meses</strong> de assinatura, conforme entendimento consolidado para serviços SaaS.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.6 Inteligência Artificial e Limitações Técnicas</h3>
            <p>
              O usuário reconhece que os modelos de IA podem produzir resultados imprecisos, incompletos ou imprevisíveis. A análise de
              fotos corporais é <strong>estimativa</strong>, não diagnóstico. Sugestões de exercícios, alimentos, cardio e suplementos podem,
              eventualmente, conter erros. O usuário deve sempre aplicar bom senso e validar com profissional habilitado antes de
              executar.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.7 Cadastro, Conta e Segurança</h3>
            <p>
              O acesso é pessoal e intransferível. O usuário é responsável pela guarda de suas credenciais e por toda atividade realizada
              em sua conta. É <strong>proibido</strong> compartilhar acesso, revender, sublicenciar ou criar contas com dados falsos.
              Em caso de uso indevido, suspeita de fraude ou compartilhamento, a conta poderá ser suspensa imediatamente sem reembolso.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.8 Pagamentos, Assinatura e Reembolso</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>A assinatura é renovada automaticamente conforme o ciclo contratado (mensal/anual), salvo cancelamento prévio;</li>
              <li>O cancelamento pode ser feito a qualquer momento dentro do app — o acesso permanece ativo até o fim do ciclo já pago;</li>
              <li>Em conformidade com o art. 49 do CDC, o usuário tem direito de arrependimento em até <strong>7 dias corridos</strong> da
                primeira contratação;</li>
              <li>Após esse prazo, valores pagos por ciclos já iniciados <strong>não são reembolsáveis</strong>, salvo determinação legal;</li>
              <li>Cashback de indicação fica retido por 7 dias após o pagamento do indicado (proteção contra chargeback);</li>
              <li>Reajustes de preço serão comunicados com no mínimo 30 dias de antecedência.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.9 Conduta Proibida</h3>
            <p>É vedado ao usuário:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Realizar engenharia reversa, descompilação ou cópia do código, metodologia ou prompts da IA;</li>
              <li>Extrair dados em massa (scraping) da plataforma;</li>
              <li>Usar a plataforma para fins ilícitos, fraudulentos ou que violem direitos de terceiros;</li>
              <li>Tentar burlar limites técnicos, sistemas de cobrança ou autenticação;</li>
              <li>Distribuir, comercializar ou redistribuir os protocolos gerados como se fossem próprios.</li>
            </ul>
            <p className="mt-2">O descumprimento autoriza a suspensão imediata da conta sem reembolso, sem prejuízo das medidas judiciais cabíveis.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.10 Propriedade Intelectual</h3>
            <p>
              Todo o conteúdo do EVORIA — incluindo software, código-fonte, design, marca, logotipos, metodologia, prompts de IA,
              banco de exercícios, banco de alimentos, textos, imagens, vídeos, artigos do Journal e materiais didáticos — é de
              <strong> propriedade exclusiva</strong> do EVORIA ou de seus licenciadores, protegido pela Lei nº 9.610/98 (Direitos
              Autorais), Lei nº 9.279/96 (Propriedade Industrial) e Lei nº 9.609/98 (Software). É proibida a reprodução, modificação ou
              uso comercial sem autorização expressa por escrito.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.11 Disponibilidade e Suporte</h3>
            <p>
              O EVORIA se esforça para manter o serviço disponível 24/7, mas <strong>não garante disponibilidade ininterrupta</strong> —
              podem ocorrer manutenções programadas, atualizações, falhas de terceiros (provedores de nuvem, IA, internet) ou eventos de
              força maior. Suporte é prestado pelos canais oficiais dentro do app, em dias úteis.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.12 Rescisão</h3>
            <p>
              Qualquer das partes pode rescindir o contrato a qualquer tempo. O EVORIA poderá <strong>encerrar a conta do usuário</strong>
              sem aviso prévio em caso de violação destes Termos, fraude, inadimplência ou conduta lesiva à comunidade. Após a rescisão,
              o usuário deixa de ter acesso aos protocolos e dados, salvo direito de portabilidade conforme LGPD.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.13 Caso Fortuito e Força Maior</h3>
            <p>
              Não haverá responsabilização por descumprimento decorrente de caso fortuito, força maior, atos de governo, pandemias,
              ataques cibernéticos, indisponibilidade de provedores essenciais ou demais eventos imprevisíveis ou inevitáveis (art. 393
              do Código Civil).
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.14 Alterações dos Termos</h3>
            <p>
              O EVORIA poderá alterar estes Termos a qualquer momento. As alterações serão comunicadas dentro do app com no mínimo
              15 dias de antecedência. O uso continuado após a vigência das alterações implica aceitação tácita dos novos termos.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.15 Lei Aplicável e Foro</h3>
            <p>
              Estes Termos são regidos pela legislação brasileira. Fica eleito o <strong>foro da comarca da sede do EVORIA</strong> para
              dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro, por mais privilegiado que seja, salvo nas
              hipóteses em que a lei consumerista determinar foro do domicílio do consumidor.
            </p>
          </section>

          {/* === BLOCO 2 — POLÍTICA DE PRIVACIDADE / LGPD === */}
          <section className="pt-4 border-t border-border">
            <h2 className="text-lg font-heading font-bold text-foreground mb-2">2. Política de Privacidade (LGPD)</h2>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD), informamos:</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.1 Dados Coletados</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Identificação: nome, e-mail, idade, sexo;</li>
              <li>Saúde: peso, altura, lesões, nível de atividade, sono, estresse;</li>
              <li>Preferências alimentares: alimentos preferidos, alergias, suplementos;</li>
              <li>Cardio: frequência, duração, modalidade;</li>
              <li>Fotos corporais (apenas quando fornecidas voluntariamente);</li>
              <li>Dados de uso: registros de treino, check-ins, avaliações, histórico de ranking.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.2 Finalidade do Tratamento</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Geração de protocolos personalizados (treino, dieta, cardio, mobilidade);</li>
              <li>Análise corporal por IA;</li>
              <li>Acompanhamento da evolução e ajustes do protocolo;</li>
              <li>Melhoria contínua do serviço (estatísticas anonimizadas);</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.3 Base Legal</h3>
            <p>
              Tratamento baseado no <strong>consentimento</strong> do titular (Art. 7º, I) e na <strong>execução do contrato</strong>
              (Art. 7º, V) da LGPD. Para dados sensíveis de saúde, há consentimento específico e destacado no onboarding.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.4 Compartilhamento</h3>
            <p>
              Não comercializamos dados. Compartilhamento ocorre apenas com: (i) provedores de infraestrutura em nuvem (armazenamento e
              processamento); (ii) provedores de IA (modelos de geração de protocolo e análise de imagem); (iii) gateways de pagamento;
              (iv) autoridades públicas, mediante ordem legal.
            </p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.5 Direitos do Titular</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Confirmar a existência de tratamento;</li>
              <li>Acessar, corrigir ou atualizar seus dados;</li>
              <li>Solicitar anonimização, bloqueio ou eliminação;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Solicitar portabilidade.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.6 Segurança</h3>
            <p>Criptografia em trânsito (HTTPS/TLS) e em repouso, controle de acesso baseado em papéis (RLS), autenticação segura e monitoramento contínuo.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.7 Retenção</h3>
            <p>Dados mantidos enquanto a conta estiver ativa. Após exclusão da conta, eliminação em até 30 dias, salvo obrigação legal de retenção (ex.: dados fiscais).</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.8 Encarregado de Dados (DPO)</h3>
            <p className="text-muted-foreground">Para exercer seus direitos ou esclarecer dúvidas, contate o DPO pelos canais de suporte do aplicativo.</p>
          </section>

          <p className="text-[10px] text-muted-foreground pt-4 border-t border-border">
            Última atualização: Abril de 2026 • Versão 2.0
          </p>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Terms;
