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
        <div className="p-4 max-w-lg mx-auto pb-12 text-sm text-secondary-foreground space-y-6">
          <section>
            <h2 className="text-lg font-heading font-bold text-foreground mb-2">1. Termos de Uso</h2>
            <p>Ao utilizar o aplicativo Hypertrophy ("Aplicativo"), você concorda com os seguintes termos e condições. Se você não concordar, não utilize o Aplicativo.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.1 Descrição do Serviço</h3>
            <p>O Hypertrophy é uma plataforma digital de consultoria fitness que utiliza inteligência artificial para gerar protocolos de treino e dieta personalizados. O serviço não substitui acompanhamento médico ou nutricional presencial.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.2 Responsabilidade do Usuário</h3>
            <p>O usuário é responsável pela veracidade das informações fornecidas durante o cadastro e onboarding. Informações incorretas podem resultar em protocolos inadequados.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.3 Isenção de Responsabilidade Médica</h3>
            <p>Os protocolos gerados são baseados em regras e algoritmos. Antes de iniciar qualquer programa de exercícios ou dieta, consulte um médico. O Hypertrophy não se responsabiliza por lesões, problemas de saúde ou quaisquer danos decorrentes do uso dos protocolos.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.4 Propriedade Intelectual</h3>
            <p>Todo conteúdo, metodologia, código-fonte e design do aplicativo são de propriedade exclusiva do Hypertrophy. É proibida a reprodução sem autorização.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">1.5 Alterações nos Termos</h3>
            <p>Reservamo-nos o direito de alterar estes termos a qualquer momento, notificando os usuários através do aplicativo.</p>
          </section>

          <section className="pt-4 border-t border-border">
            <h2 className="text-lg font-heading font-bold text-foreground mb-2">2. Política de Privacidade (LGPD)</h2>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD), informamos:</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.1 Dados Coletados</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Dados de identificação: nome, e-mail, idade, sexo</li>
              <li>Dados de saúde: peso, altura, lesões, nível de atividade, horas de sono</li>
              <li>Dados de preferência alimentar: alimentos preferidos, alergias, suplementos</li>
              <li>Fotos corporais (quando fornecidas voluntariamente)</li>
              <li>Dados de uso: registros de treino, check-ins, avaliações diárias</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.2 Finalidade do Tratamento</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Geração de protocolos personalizados de treino e dieta</li>
              <li>Análise corporal por inteligência artificial</li>
              <li>Acompanhamento da evolução do usuário</li>
              <li>Melhoria contínua do serviço</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.3 Base Legal</h3>
            <p>O tratamento dos dados é realizado com base no consentimento do titular (Art. 7º, I da LGPD) e na execução de contrato (Art. 7º, V da LGPD).</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.4 Compartilhamento</h3>
            <p>Seus dados não são compartilhados com terceiros, exceto quando necessário para a prestação do serviço (infraestrutura de nuvem) ou quando exigido por lei.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.5 Direitos do Titular</h3>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.6 Segurança</h3>
            <p>Utilizamos criptografia, controle de acesso e políticas de segurança para proteger seus dados contra acessos não autorizados.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.7 Retenção de Dados</h3>
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, seus dados serão eliminados em até 30 dias, exceto quando houver obrigação legal de retenção.</p>
          </section>

          <section>
            <h3 className="font-heading font-semibold text-foreground mb-1">2.8 Contato do Encarregado (DPO)</h3>
            <p className="text-muted-foreground">Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento dos seus dados, entre em contato através do SAC no aplicativo.</p>
          </section>

          <p className="text-[10px] text-muted-foreground pt-4">Última atualização: Abril de 2026</p>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Terms;
