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
    title: "Cada série calculada pra te levar adiante",
    desc: "O sistema processa composição corporal estimada e prioridades do seu objetivo. Cada variável entra no cálculo do seu plano.",
    image: mockTraining,
  },
  {
    eyebrow: "ESTRUTURA ALIMENTAR",
    title: "Organizado com a comida que você já come",
    desc: "Macros sugeridos com base no seu objetivo. Refeições montadas com os alimentos que você já consome. Porque estrutura que você odeia, você abandona.",
    image: mockDiet,
    reverse: true,
  },
  {
    eyebrow: "ANÁLISE POR FOTO IA",
    title: "Seu ponto de partida lido em segundos",
    desc: "Você envia 4 fotos. O sistema estima sua composição corporal e define as prioridades do seu plano. Estimativa visual com IA, não avaliação clínica ou diagnóstico.",
    image: mockAi,
  },
  {
    eyebrow: "PROGRESSO MEDIDO",
    title: "Você vê o resultado antes do espelho mostrar",
    desc: "Peso, composição, treinos completados, ranking semanal. Tudo num só lugar, pra manter o foco quando a motivação oscila.",
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
    "A IA executa o cálculo. A metodologia é minha. As regras do sistema foram construídas em mais de 10 anos de prática direta com alunos e validadas pela ciência.",
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
    q: "Preciso pagar antes de saber o que vou receber?",
    a: "Não. Você faz o quiz, o sistema gera seu protocolo completo e você decide se vale a pena. Só paga quando quiser liberar o acesso. Sem pressão.",
  },
  {
    q: "Quanto custa?",
    a: "No lançamento: R$29,90 no primeiro mês (depois R$97/mês) ou R$599 no anual (depois R$897). Cancela quando quiser — sem fidelidade, sem multa.",
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
