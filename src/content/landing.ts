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
import mockTraining from "@/assets/mockup-training.png";
import mockDiet from "@/assets/mockup-diet.png";
import mockProgress from "@/assets/mockup-progress.png";
import mockAi from "@/assets/mockup-ai.png";
import coachKevin from "@/assets/coach-kevin.jpg";
import transformation1 from "@/assets/transformation-1.jpg";
import transformation2 from "@/assets/transformation-2.jpg";
import transformation3 from "@/assets/transformation-3.jpg";

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
    eyebrow: "Treino sob medida",
    title: "Cada série calculada pra te levar adiante",
    desc: "Divisão, exercícios, séries, reps, descanso e progressão definidos pela metodologia. Seu treino evolui semana a semana.",
    image: mockTraining,
  },
  {
    eyebrow: "Dieta inteligente",
    title: "Macros precisos com a comida que você gosta",
    desc: "Proteína, carbo e gordura no ponto certo do seu objetivo. Refeições montadas com seus alimentos preferidos — porque dieta que você odeia não dura.",
    image: mockDiet,
    reverse: true,
  },
  {
    eyebrow: "Avaliação por foto IA",
    title: "Sua composição corporal lida em segundos",
    desc: "Mande 4 fotos. A IA estima percentual de gordura, identifica desequilíbrios posturais e mapeia pontos fortes e a desenvolver. Tudo entra na receita do seu protocolo.",
    image: mockAi,
  },
  {
    eyebrow: "Progresso medido",
    title: "Você vê o resultado antes do espelho mostrar",
    desc: "Peso, gordura, treinos completados, ranking semanal. Tudo num só lugar, para manter o foco quando a motivação some.",
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
  eyebrow: "Quem está por trás",
  firstName: "Kevin",
  lastName: "Franzen",
  photo: coachKevin,
  // Cada string é um parágrafo — adicione/remova quantos quiser
  paragraphs: [
    "Sou treinador e atleta apaixonado por transformação real. Passei anos vendo gente boa desperdiçar tempo com plano genérico, dieta restritiva e promessa milagrosa.\n \nConstruí esse app pra entregar o melhor do meu conhecimento, assim como fazemos na minha consultoria individual — só que escalado, acessível, 24h e no seu bolso.",
    "A metodologia une o que funciona na sala de musculação com o que a ciência confirma no laboratório. A IA acelera o cálculo. Mas a regra final é sempre minha.",
  ],
  // Pontos fortes (lista com check verde)
  bullets: [
    "Anos formando atletas e amadores em busca de evolução real",
    "Metodologia construída na prática e validada por base científica atual",
    "IA usada como ferramenta, quem dita as regras do protocolo é o profissional",
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
    a: "Não. O quiz e a avaliação por foto são gratuitos. Você só decide pagar depois de ver tudo que o app vai entregar pro seu objetivo.",
  },
  {
    q: "Funciona pra iniciante?",
    a: "Sim. O protocolo se ajusta ao seu nível atual — desde quem nunca pisou numa academia até atleta intermediário/avançado. A progressão respeita seu ponto de partida.",
  },
  {
    q: "Em quanto tempo vejo resultado?",
    a: "Os primeiros sinais (energia, força, postura) aparecem em 2 a 4 semanas. A mudança visível geralmente acontece entre 8 e 12 semanas, com adesão ao plano.",
  },
  {
    q: "E se eu treinar em casa, sem academia?",
    a: "O treino se adapta ao seu equipamento — academia completa, garagem com halteres ou só peso corporal. A metodologia é a mesma, o caminho muda.",
  },
  {
    q: "O protocolo é só pra hipertrofia?",
    a: "Não. A metodologia atende hipertrofia, emagrecimento, recomposição e performance. Você define o objetivo no quiz e o protocolo é construído pra ele.",
  },
  {
    q: "Tem coach ou é só app?",
    a: "Você tem um coach IA 24/7 dentro do app pra tirar dúvidas, ajustar exercício, sugerir substituição. Tudo dentro das regras definidas pelo treinador responsável.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa, sem letra miúda. Cancelou, segue até o fim do período pago e acabou.",
  },
];
