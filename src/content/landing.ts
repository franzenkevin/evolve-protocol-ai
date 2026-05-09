/**
 * ============================================================
 *  CONTEÚDO EDITÁVEL DA LANDING PAGE
 * ============================================================
 *  Este é o ÚNICO arquivo que você precisa editar pra atualizar:
 *   - Resultados / depoimentos (antes/depois)
 *   - Mockups do app (imagens + textos)
 *   - Sobre você (Kevin)
 *   - FAQ (perguntas e respostas)
 *
 *  Como adicionar/trocar imagens:
 *   1. Coloque o arquivo em src/assets/
 *   2. Importe no topo deste arquivo (ver exemplos abaixo)
 *   3. Use o nome importado no campo "image" / "before" / "after"
 * ============================================================
 */

// ---------- IMAGENS USADAS ----------
import mockTraining from "@/assets/mockup-training.webp";
import mockDiet from "@/assets/mockup-diet.webp";
import mockProgress from "@/assets/mockup-progress.webp";
import mockAi from "@/assets/mockup-ai.webp";
import coachKevin from "@/assets/coach-kevin.webp";
import transformation1 from "@/assets/transformation-1.webp";
import transformation2 from "@/assets/transformation-2.webp";
import transformation3 from "@/assets/transformation-3.webp";

// ============================================================
//  1) MOCKUPS DO APP (seção "Tudo no app")
// ============================================================
export type FeatureContent = {
  eyebrow: string;       // texto pequeno acima do título
  title: string;         // título principal da feature
  desc: string;          // descrição (1-2 frases)
  image: string;         // imagem do mockup
  reverse?: boolean;     // true = imagem à esquerda no desktop
};

export const FEATURES_CONTENT: FeatureContent[] = [
  {
    eyebrow: "TREINO SOB MEDIDA",
    title: "Volume, descanso e progressão organizados com lógica.",
    desc: "A EVORIA estrutura variáveis do treino com base no seu objetivo, experiência e dados informados, para reduzir tentativa e erro.",
    image: mockTraining,
  },
  {
    eyebrow: "ESTRUTURA ALIMENTAR",
    title: "Estrutura alimentar com a comida que você já consome",
    desc: "Macros e referências alimentares sugeridas com base nas informações fornecidas por você. A ideia é organizar escolhas dentro da sua rotina porque uma estrutura que você odeia, você abandona.",
    image: mockDiet,
    reverse: true,
  },
  {
    eyebrow: "LEITURA CORPORAL POR IA",
    title: "Seu ponto de partida lido em segundos",
    desc: "Você envia 4 fotos para ajudar o sistema a organizar uma leitura visual do seu momento físico. Essa estimativa é computacional e não constitui avaliação clínica, diagnóstico ou laudo profissional.",
    image: mockAi,
  },
  {
    eyebrow: "PROGRESSO MEDIDO",
    title: "Você vê o resultado antes do espelho mostrar",
    desc: "Peso, composição, treinos concluídos e evolução em um só lugar para manter clareza quando a motivação oscila.",
    image: mockProgress,
    reverse: true,
  },
];

// ============================================================
//  2) RESULTADOS REAIS (seção "Quem confiou no processo")
// ============================================================
export type ResultContent = {
  name: string;          // nome e idade — ex: "Lucas, 32"
  goal: string;          // tag de objetivo — ex: "Emagrecimento"
  detail: string;        // resultado em uma linha — ex: "92 kg → 78 kg em 5 meses"
  quote: string;         // depoimento curto entre aspas
  before: string;        // foto ANTES (use a mesma imagem se ainda não tiver)
  after: string;         // foto DEPOIS
};

export const RESULTS_CONTENT: ResultContent[] = [
  {
    name: "Lucas, 32",
    goal: "Emagrecimento",
    detail: "92 kg → 78 kg em 5 meses",
    quote:
      "Nunca pensei que comer bem podia ser tão simples. O app fez o trabalho pesado.",
    before: transformation1,
    after: transformation1,
  },
  {
    name: "Mariana, 28",
    goal: "Recomposição",
    detail: "Perdeu 7% de gordura, ganhou 3 kg de músculo",
    quote: "Treino e dieta no piloto automático. Só foco em executar.",
    before: transformation2,
    after: transformation2,
  },
  {
    name: "Pedro, 22",
    goal: "Hipertrofia",
    detail: "+11 kg de massa magra em 8 meses",
    quote:
      "Saí do 'falso magro' pra primeira vez vendo músculo de verdade aparecer.",
    before: transformation3,
    after: transformation3,
  },
];

// ============================================================
//  3) SOBRE VOCÊ (seção "Quem está por trás")
// ============================================================
export const ABOUT_CONTENT = {
  eyebrow: "QUEM DESENVOLVEU A METODOLOGIA",
  firstName: "Kevin",
  lastName: "Franzen",
  photo: coachKevin,
  // Cada string é um parágrafo — adicione/remova quantos quiser
  paragraphs: [
    "A tecnologia organiza. A metodologia orienta. As regras do sistema foram construídas em mais de 10 anos de prática direta com alunos e validadas pela ciência.",
    "Vi médicos, advogados e executivos com pouco tempo disponível investirem em 6 a 7 treinos por semana durante anos e continuarem no mesmo lugar. Não por falta de vontade. Por falta de protocolo real e sustentável.",
    "Desenvolvi esse sistema pra entregar a mesma estrutura que aplico na consultoria individual, de forma automatizada e com acesso direto, pra todo mundo que quer resultado e não tem espaço na agenda pra mais um compromisso semanal.",
  ],
  // Pontos fortes (lista com check verde)
  bullets: [
    "10+ anos atendendo atletas e profissionais que vivem o lifestyle",
    "+100 alunos ativos hoje, com retenção acima da média do mercado",
    "Metodologia construída na prática, referenciada em ciência",
    "Evoria é Sistema, não chatbot genérico. A lógica do protocolo é humana.",
  ],
};

// ============================================================
//  4) FAQ (seção "Antes que você pergunte")
// ============================================================
export type FAQItem = {
  q: string;   // pergunta
  a: string;   // resposta
};

export const FAQ_CONTENT: FAQItem[] = [
  {
    q: "A EVORIA substitui profissional de saúde ou educação física?",
    a: "Não. A EVORIA é uma plataforma digital de organização de rotina física e alimentar. Para condições clínicas, lesões, restrições específicas ou necessidade de acompanhamento individual, procure um profissional habilitado.",
  },
  {
    q: "Posso usar se tenho lesão ou condição clínica?",
    a: "Em casos de lesões, condições clínicas, restrições importantes ou necessidade de supervisão individual, procure um profissional habilitado antes de iniciar qualquer rotina.",
  },
  {
    q: "Como minhas fotos são usadas?",
    a: "As fotos ajudam o sistema a organizar uma leitura visual do seu ponto de partida. Elas não são usadas em divulgação sem autorização específica e seguem as regras de privacidade e exclusão previstas na política da plataforma.",
  },
  {
    q: "Depois do primeiro mês, quanto custa?",
    a: "O primeiro mês sai por R$29,90. Depois, o plano mensal segue por R$97/mês, com cancelamento conforme as regras informadas no checkout.",
  },
  {
    q: "Preciso pagar antes de saber o que vou receber?",
    a: "Não. Você faz o quiz, o sistema organiza sua estrutura inicial e você decide se vale a pena liberar o acesso completo. Sem pressão.",
  },
  {
    q: "Depois do primeiro mês, quanto custa?",
    a: "O primeiro mês sai por R$29,90. Depois, o plano mensal segue por R$97/mês, com cancelamento conforme as regras informadas no checkout.",
  },
  {
    q: "Funciona pra quem já treina faz anos?",
    a: "Sim — e especialmente pra você. O sistema foi desenvolvido pra quem já tem disciplina mas não tem o protocolo certo. Se você treina consistentemente e o resultado não é proporcional ao esforço, é exatamente disso que se trata.",
  },
  {
    q: "Funciona pra iniciante?",
    a: "Também. O quiz identifica seu nível e o sistema estrutura o protocolo adequado — sem exigir que você já saiba se exercitar.",
  },
  {
    q: "Em quanto tempo vejo resultado?",
    a: "Depende do seu ponto de partida e do objetivo. A maioria dos usuários relata mudanças visíveis entre 3 e 6 semanas seguindo o protocolo. O sistema ajusta a cada 60 dias conforme sua evolução registrada.",
  },
  {
    q: "E se eu treinar em casa, sem academia?",
    a: "O quiz pergunta sobre equipamento disponível. O sistema estrutura o protocolo com o que você tem — academia completa, espaço em casa ou peso corporal.",
  },
  {
    q: "O protocolo é só pra hipertrofia?",
    a: "Não. O sistema cobre três objetivos: ganho de massa magra, redução de gordura corporal e performance. Você escolhe no quiz — e pode mudar depois.",
  },
  {
    q: "Isso é diferente de usar um app grátis?",
    a: "Sim. Apps como MyFitnessPal ou Hevy são ferramentas — você ainda precisa saber o que fazer. O EVORIA gera o protocolo por você, baseado no seu corpo, objetivo e rotina. É a diferença entre uma calculadora e um sistema que pensa por você.",
  },
  {
    q: "Tem coach ou é só sistema?",
    a: "O EVORIA é um sistema digital baseado na metodologia Kevin Franzen. O sistema faz o trabalho — disponível 24h, sem fila de espera. Para acompanhamento individual com o Kevin, existe a consultoria separada.",
  },
  {
    q: "Minhas fotos ficam seguras?",
    a: "Suas fotos são processadas pelo sistema para gerar a análise e não são compartilhadas, vendidas ou expostas publicamente. Política de privacidade completa disponível no rodapé.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade. Sem multa. Sem burocracia. Cancela em 1 clique.",
  },
];
