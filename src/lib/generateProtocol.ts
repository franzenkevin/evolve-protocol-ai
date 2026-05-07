import type { Profile } from "@/hooks/useProfile";
import {
  SPLITS_MEN,
  SPLITS_WOMEN,
  getSetScheme,
  type SplitVariant,
} from "@/lib/workoutRules";

/**
 * Generates a default training + diet protocol based on user profile.
 * Rule-based fallback — usado quando o GPT-5 falha.
 * Segue METODOLOGIA OFICIAL HYPERTROPHY (ver src/lib/workoutRules.ts).
 */
export function generateProtocol(profile: Profile) {
  const training = generateTraining(profile);
  const diet = generateDiet(profile);
  const cardioPlan = buildCardioPlan(profile);
  return { training, diet, cardioPlan };
}

// ==================== TRAINING (refatorado — Fase 1 metodologia) ====================

const WEEKDAY_ORDER: Record<string, number> = {
  "Segunda": 0, "Terça": 1, "Quarta": 2, "Quinta": 3,
  "Sexta": 4, "Sábado": 5, "Domingo": 6,
};

// Banco de exercícios indexado por foco (focus → ordered list)
// Cada exercício: { name, primary, accessory? } — para cálculo de volume 1.0 + 0.5
type ExDef = { name: string; primary: string; accessory?: string; rest: string };

const EX_BANK: Record<string, ExDef[]> = {
  // ===== INFERIOR =====
  inferior: [
    { name: "Agachamento livre", primary: "quadriceps", accessory: "gluteo", rest: "120s" },
    { name: "Leg press 45°", primary: "quadriceps", accessory: "gluteo", rest: "90s" },
    { name: "Cadeira extensora", primary: "quadriceps", rest: "60s" },
    { name: "Stiff", primary: "posterior_coxa", accessory: "gluteo", rest: "90s" },
    { name: "Mesa flexora", primary: "posterior_coxa", rest: "60s" },
    { name: "Elevação pélvica com barra", primary: "gluteo", accessory: "posterior_coxa", rest: "90s" },
    { name: "Cadeira abdutora", primary: "gluteo", rest: "45s" },
    { name: "Panturrilha em pé", primary: "panturrilha", rest: "45s" },
  ],
  inferior_posterior: [
    { name: "Stiff", primary: "posterior_coxa", accessory: "gluteo", rest: "90s" },
    { name: "Mesa flexora", primary: "posterior_coxa", rest: "60s" },
    { name: "Elevação pélvica com barra", primary: "gluteo", accessory: "posterior_coxa", rest: "90s" },
    { name: "Bom dia (good morning)", primary: "posterior_coxa", accessory: "gluteo", rest: "75s" },
    { name: "Cadeira flexora unilateral", primary: "posterior_coxa", rest: "60s" },
    { name: "Panturrilha sentado", primary: "panturrilha", rest: "45s" },
  ],
  // ===== SUPERIOR (mulheres) =====
  superior: [
    { name: "Puxada frontal", primary: "costas", accessory: "biceps", rest: "75s" },
    { name: "Remada sentada", primary: "costas", accessory: "biceps", rest: "75s" },
    { name: "Desenvolvimento com halteres", primary: "deltoide_frontal", accessory: "triceps", rest: "75s" },
    { name: "Elevação lateral", primary: "deltoide_lateral", rest: "45s" },
    { name: "Crucifixo invertido", primary: "deltoide_posterior", rest: "45s" },
    { name: "Tríceps pulley corda", primary: "triceps", rest: "60s" },
    { name: "Rosca direta", primary: "biceps", rest: "60s" },
  ],
  superior_gluteo: [
    { name: "Puxada frontal", primary: "costas", accessory: "biceps", rest: "75s" },
    { name: "Remada sentada", primary: "costas", accessory: "biceps", rest: "75s" },
    { name: "Elevação lateral", primary: "deltoide_lateral", rest: "45s" },
    { name: "Crucifixo invertido", primary: "deltoide_posterior", rest: "45s" },
    { name: "Tríceps pulley corda", primary: "triceps", rest: "60s" },
    { name: "Rosca direta", primary: "biceps", rest: "60s" },
    { name: "Coice na polia (glúteo isolado)", primary: "gluteo", rest: "45s" },
    { name: "Abdução em pé na polia", primary: "gluteo", rest: "45s" },
  ],
  // ===== PUSH (homens) =====
  push: [
    { name: "Supino reto com barra", primary: "peito", accessory: "deltoide_frontal", rest: "120s" },
    { name: "Supino inclinado halteres", primary: "peito", accessory: "deltoide_frontal", rest: "90s" },
    { name: "Crucifixo máquina", primary: "peito", rest: "60s" },
    { name: "Desenvolvimento com halteres", primary: "deltoide_frontal", accessory: "triceps", rest: "90s" },
    { name: "Elevação lateral", primary: "deltoide_lateral", rest: "45s" },
    { name: "Tríceps testa barra EZ", primary: "triceps", rest: "60s" },
    { name: "Tríceps pulley corda", primary: "triceps", rest: "60s" },
  ],
  // ===== PULL (homens) =====
  pull: [
    { name: "Puxada frontal", primary: "costas", accessory: "biceps", rest: "90s" },
    { name: "Remada curvada", primary: "costas", accessory: "biceps", rest: "90s" },
    { name: "Remada unilateral halteres", primary: "costas", accessory: "biceps", rest: "75s" },
    { name: "Pulldown corda", primary: "costas", rest: "60s" },
    { name: "Crucifixo invertido", primary: "deltoide_posterior", rest: "45s" },
    { name: "Rosca direta barra", primary: "biceps", rest: "60s" },
    { name: "Rosca martelo", primary: "biceps", rest: "60s" },
  ],
  // ===== LEGS (homens) =====
  legs: [
    { name: "Agachamento livre", primary: "quadriceps", accessory: "gluteo", rest: "120s" },
    { name: "Leg press 45°", primary: "quadriceps", accessory: "gluteo", rest: "90s" },
    { name: "Cadeira extensora", primary: "quadriceps", rest: "60s" },
    { name: "Stiff", primary: "posterior_coxa", accessory: "gluteo", rest: "90s" },
    { name: "Mesa flexora", primary: "posterior_coxa", rest: "60s" },
    { name: "Panturrilha em pé", primary: "panturrilha", rest: "45s" },
    { name: "Abdominal infra", primary: "abdomen", rest: "45s" },
  ],
  // ===== UPPER (homens) =====
  upper: [
    { name: "Supino inclinado halteres", primary: "peito", accessory: "deltoide_frontal", rest: "90s" },
    { name: "Puxada frontal", primary: "costas", accessory: "biceps", rest: "90s" },
    { name: "Remada sentada", primary: "costas", accessory: "biceps", rest: "75s" },
    { name: "Desenvolvimento máquina", primary: "deltoide_frontal", accessory: "triceps", rest: "75s" },
    { name: "Elevação lateral", primary: "deltoide_lateral", rest: "45s" },
    { name: "Tríceps pulley corda", primary: "triceps", rest: "60s" },
    { name: "Rosca direta", primary: "biceps", rest: "60s" },
  ],
  // ===== FULL BODY =====
  fullbody_women: [
    // Mobilidade + 5 inferiores + 2-3 superiores
    { name: "Mobilidade de quadril (5min)", primary: "abdomen", rest: "0s" },
    { name: "Agachamento livre", primary: "quadriceps", accessory: "gluteo", rest: "120s" },
    { name: "Elevação pélvica com barra", primary: "gluteo", accessory: "posterior_coxa", rest: "90s" },
    { name: "Stiff", primary: "posterior_coxa", accessory: "gluteo", rest: "90s" },
    { name: "Cadeira abdutora", primary: "gluteo", rest: "45s" },
    { name: "Panturrilha em pé", primary: "panturrilha", rest: "45s" },
    { name: "Puxada frontal", primary: "costas", accessory: "biceps", rest: "75s" },
    { name: "Desenvolvimento halteres", primary: "deltoide_frontal", accessory: "triceps", rest: "75s" },
  ],
  fullbody_men: [
    { name: "Agachamento livre", primary: "quadriceps", accessory: "gluteo", rest: "120s" },
    { name: "Supino reto com barra", primary: "peito", accessory: "deltoide_frontal", rest: "120s" },
    { name: "Remada curvada", primary: "costas", accessory: "biceps", rest: "90s" },
    { name: "Stiff", primary: "posterior_coxa", accessory: "gluteo", rest: "90s" },
    { name: "Desenvolvimento com halteres", primary: "deltoide_frontal", accessory: "triceps", rest: "75s" },
    { name: "Rosca direta", primary: "biceps", rest: "60s" },
    { name: "Tríceps pulley corda", primary: "triceps", rest: "60s" },
  ],
  // ===== COMPLEMENTO (cardio + abs) =====
  complemento: [
    { name: "Cardio LISS (30-40min, 60-70% FCmax)", primary: "abdomen", rest: "0s" },
    { name: "Abdominal infra", primary: "abdomen", rest: "45s" },
    { name: "Prancha", primary: "abdomen", rest: "30s" },
    { name: "Abdominal supra na polia", primary: "abdomen", rest: "45s" },
  ],
};

// Mapeia o "focus" textual da divisão → chave do banco
function focusKey(focus: string, sex: "M" | "F"): keyof typeof EX_BANK {
  const f = focus.toLowerCase();
  if (f.includes("full body")) return sex === "F" ? "fullbody_women" : "fullbody_men";
  if (f.includes("ênfase posterior") || f.includes("enfase posterior")) return "inferior_posterior";
  if (f.includes("superior + glúteo") || f.includes("superior + gluteo")) return "superior_gluteo";
  if (f.includes("inferior")) return "inferior";
  if (f.includes("superior")) return "superior";
  if (f.includes("push")) return "push";
  if (f.includes("pull")) return "pull";
  if (f.includes("legs")) return "legs";
  if (f.includes("upper")) return "upper";
  if (f.includes("cardio") || f.includes("complemento")) return "complemento";
  return sex === "F" ? "superior" : "upper";
}

function pickSplitVariant(sex: "M" | "F", days: number): SplitVariant {
  const table = sex === "F" ? SPLITS_WOMEN : SPLITS_MEN;
  const variants = table[days] || table[4] || table[3];
  return variants.find((v) => v.defaultChoice) || variants[0];
}

function generateTraining(p: Profile) {
  const sex: "M" | "F" = p.sex === "F" ? "F" : "M";
  const days = Math.max(2, Math.min(7, p.training_days || 4));
  const weekdays = p.training_weekdays || [];
  const sortedWeekdays = [...weekdays].sort((a, b) => (WEEKDAY_ORDER[a] ?? 0) - (WEEKDAY_ORDER[b] ?? 0));

  const variant = pickSplitVariant(sex, days);
  const { scheme, level } = getSetScheme(p.experience);

  // Quantos exercícios por dia? (heurística — a IA real é mais granular)
  const targetEx = level === "advanced" ? 7 : 6;

  // Cardio integrado por dia (se habilitado)
  const cardioEnabled = p.cardio_enabled !== false;
  const cardioFreq = (p.cardio_frequency || "").toLowerCase();
  const cardioType = p.cardio_type_preference || "Esteira (caminhada inclinada)";
  const cardioDur = p.cardio_duration || "20-30min";
  const cardioTiming = (p.cardio_timing || "").toLowerCase();

  // Distribuir cardio em ~metade dos dias se freq não específica
  const numCardioDays = cardioEnabled
    ? cardioFreq.includes("todo") ? days
    : cardioFreq.includes("5") ? 5
    : cardioFreq.includes("4") ? 4
    : cardioFreq.includes("3") ? 3
    : cardioFreq.includes("2") ? 2
    : cardioFreq.includes("1") ? 1
    : Math.ceil(days / 2)
    : 0;

  return variant.days.map((dayDef, i) => {
    const weekday = sortedWeekdays[i] || "";
    const fk = focusKey(dayDef.focus, sex);
    const list = EX_BANK[fk] || [];
    const exercises = list.slice(0, targetEx).map((ex, j) => ({
      id: `${i}-${j}`,
      name: ex.name,
      primary: ex.primary,
      accessory: ex.accessory || null,
      sets: scheme.validSets.length, // séries válidas
      warmups: scheme.warmups,
      validSetsScheme: scheme.validSets,
      reps: scheme.validSets.map((s) => s.reps).join(" / "),
      rest: ex.rest,
      technique: "standard" as const,
      done: false,
    }));

    const includeCardio = cardioEnabled && i < numCardioDays;
    const cardio = includeCardio
      ? {
          modality: cardioType,
          duration: cardioDur,
          intensity: cardioTiming.includes("jejum") ? "60-65% FCmax (LISS jejum)" : "65-75% FCmax",
          when: cardioTiming || "após o treino",
        }
      : null;

    const label = weekday
      ? `${weekday} — ${dayDef.code}: ${dayDef.focus}`
      : `Dia ${dayDef.code} — ${dayDef.focus}`;

    return {
      label,
      code: dayDef.code,
      focus: dayDef.focus,
      muscleGroup: dayDef.focus,
      weekday,
      exercises,
      cardio,
      level,
      schemeDescription: scheme.description,
    };
  });
}

function buildCardioPlan(p: Profile) {
  if (p.cardio_enabled === false) return null;
  return {
    type: p.cardio_type_preference || "Esteira (caminhada inclinada)",
    frequency: p.cardio_frequency || "3-4x por semana",
    duration: p.cardio_duration || "20-30min",
    timing: p.cardio_timing || "após o treino",
    note: "Cardio aparece embutido em cada dia de treino — não é treino separado.",
  };
}


// ==================== DIET ====================

interface FoodItem {
  name: string;
  amount: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface MealOption {
  label: string;
  foods: FoodItem[];
}

// New format: each substitution option carries the exact portion + macros
// to keep swaps isocaloric & iso-macro relative to a referenceFood.
// Old format (string[]) is still rendered as a fallback in the UI.
export interface SubstitutionOption {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealSubstitution {
  category: string;
  referenceFood?: SubstitutionOption;
  options: SubstitutionOption[] | string[];
}

interface Meal {
  label: string;
  time: string;
  options: MealOption[];
  substitutions: MealSubstitution[];
}

// Food database with macros per typical serving
const FOOD_DB: Record<string, FoodItem> = {
  // Carbs
  "Arroz": { name: "Arroz branco", amount: "150g (cozido)", protein: 4, carbs: 42, fat: 0, calories: 195 },
  "Batata inglesa": { name: "Batata inglesa", amount: "200g (cozida)", protein: 4, carbs: 34, fat: 0, calories: 154 },
  "Batata doce": { name: "Batata doce", amount: "200g (cozida)", protein: 3, carbs: 40, fat: 0, calories: 172 },
  "Mandioca": { name: "Mandioca", amount: "150g (cozida)", protein: 2, carbs: 39, fat: 0, calories: 160 },
  "Macarrão": { name: "Macarrão", amount: "150g (cozido)", protein: 5, carbs: 44, fat: 1, calories: 200 },
  // PÃES E WRAPS — em unidade (peso padrão por unidade conhecido)
  "Pão de forma": { name: "Pão de forma", amount: "2 fatias (50g)", protein: 5, carbs: 24, fat: 2, calories: 140 },
  "Pão francês": { name: "Pão francês", amount: "1 unidade (50g)", protein: 4, carbs: 28, fat: 1, calories: 135 },
  "Pão de hambúrguer": { name: "Pão de hambúrguer", amount: "1 unidade (60g)", protein: 5, carbs: 30, fat: 3, calories: 160 },
  "Rap10": { name: "Rap10", amount: "1 unidade (45g)", protein: 4, carbs: 22, fat: 2, calories: 120 },
  // CUSCUZ E TAPIOCA — em gramas (peso varia muito)
  "Cuscuz": { name: "Cuscuz cozido", amount: "150g", protein: 4, carbs: 38, fat: 1, calories: 170 },
  "Tapioca": { name: "Tapioca (massa pronta)", amount: "60g", protein: 1, carbs: 36, fat: 0, calories: 150 },

  // Proteins
  "Peito de frango": { name: "Peito de frango grelhado", amount: "150g", protein: 45, carbs: 0, fat: 3, calories: 210 },
  "Sobrecoxa sem pele": { name: "Sobrecoxa sem pele", amount: "150g", protein: 38, carbs: 0, fat: 8, calories: 225 },
  "Patinho": { name: "Patinho grelhado", amount: "150g", protein: 42, carbs: 0, fat: 5, calories: 215 },
  "Músculo": { name: "Músculo cozido", amount: "150g", protein: 40, carbs: 0, fat: 6, calories: 220 },
  "Filé mignon": { name: "Filé mignon grelhado", amount: "150g", protein: 43, carbs: 0, fat: 7, calories: 240 },
  "Coxão mole": { name: "Coxão mole grelhado", amount: "150g", protein: 41, carbs: 0, fat: 6, calories: 220 },
  "Salmão": { name: "Salmão grelhado", amount: "150g", protein: 34, carbs: 0, fat: 14, calories: 270 },
  "Tilápia": { name: "Tilápia grelhada", amount: "150g", protein: 35, carbs: 0, fat: 3, calories: 170 },
  "Atum": { name: "Atum em lata (drenado)", amount: "120g (1 lata)", protein: 30, carbs: 0, fat: 1, calories: 130 },
  // OVO — em unidade
  // Ovos: SEMPRE em unidades (TACO), nunca em gramas, independente do preparo
  "Ovo": { name: "Ovo inteiro", amount: "2 unidades", protein: 13, carbs: 1, fat: 11, calories: 156 },
  "Clara de ovo": { name: "Clara de ovo", amount: "3 unidades", protein: 11, carbs: 1, fat: 0, calories: 51 },

  // Dairy
  "Queijo": { name: "Queijo branco", amount: "30g", protein: 6, carbs: 1, fat: 5, calories: 70 },
  "Leite desnatado": { name: "Leite desnatado", amount: "200ml", protein: 7, carbs: 10, fat: 0, calories: 70 },
  "Leite semi desnatado": { name: "Leite semi desnatado", amount: "200ml", protein: 7, carbs: 10, fat: 3, calories: 90 },
  "Iogurte desnatado": { name: "Iogurte desnatado", amount: "170g", protein: 8, carbs: 12, fat: 0, calories: 80 },
  "Requeijão light": { name: "Requeijão light", amount: "30g", protein: 3, carbs: 1, fat: 3, calories: 45 },

  // Others
  "Feijão": { name: "Feijão carioca", amount: "100g (cozido)", protein: 7, carbs: 18, fat: 1, calories: 110 },
  "Lentilha": { name: "Lentilha", amount: "100g (cozida)", protein: 9, carbs: 20, fat: 0, calories: 116 },
  "Granola": { name: "Granola", amount: "40g", protein: 3, carbs: 28, fat: 5, calories: 170 },
  "Aveia": { name: "Aveia", amount: "40g", protein: 5, carbs: 28, fat: 3, calories: 150 },
  "Vegetais": { name: "Vegetais e salada", amount: "à vontade", protein: 2, carbs: 5, fat: 0, calories: 25 },
  "Inhame": { name: "Inhame", amount: "200g (cozido)", protein: 3, carbs: 36, fat: 0, calories: 158 },
  "Milho": { name: "Milho cozido", amount: "1 espiga", protein: 4, carbs: 25, fat: 1, calories: 120 },
  "Sardinha": { name: "Sardinha em lata", amount: "1 lata (125g)", protein: 25, carbs: 0, fat: 8, calories: 170 },
  "Camarão": { name: "Camarão cozido", amount: "150g", protein: 30, carbs: 1, fat: 2, calories: 140 },
  "Carne de porco magra": { name: "Lombo suíno grelhado", amount: "150g", protein: 38, carbs: 0, fat: 6, calories: 210 },
  "Goiaba": { name: "Goiaba", amount: "150g", protein: 2, carbs: 14, fat: 1, calories: 68 },
  "Ameixa": { name: "Ameixa", amount: "100g", protein: 1, carbs: 18, fat: 0, calories: 70 },
  "Pêssego": { name: "Pêssego", amount: "150g", protein: 1, carbs: 15, fat: 0, calories: 60 },
  "Grão de bico": { name: "Grão de bico", amount: "100g (cozido)", protein: 9, carbs: 22, fat: 3, calories: 140 },
  "Pasta de amendoim": { name: "Pasta de amendoim", amount: "20g", protein: 5, carbs: 3, fat: 10, calories: 120 },
  "Castanhas": { name: "Castanhas mistas", amount: "30g", protein: 5, carbs: 5, fat: 15, calories: 175 },
  "Azeite de oliva": { name: "Azeite de oliva", amount: "1 colher sopa", protein: 0, carbs: 0, fat: 14, calories: 120 },

  // FRUTAS — sempre em GRAMAS (peso varia muito por unidade)
  "Banana": { name: "Banana", amount: "120g", protein: 1, carbs: 27, fat: 0, calories: 105 },
  "Mamão": { name: "Mamão papaya", amount: "150g", protein: 1, carbs: 15, fat: 0, calories: 60 },
  "Melão": { name: "Melão", amount: "200g", protein: 1, carbs: 16, fat: 0, calories: 64 },
  "Melancia": { name: "Melancia", amount: "200g", protein: 1, carbs: 16, fat: 0, calories: 60 },
  "Kiwi": { name: "Kiwi", amount: "150g", protein: 2, carbs: 22, fat: 1, calories: 90 },
  "Uva": { name: "Uva", amount: "150g", protein: 1, carbs: 27, fat: 0, calories: 103 },
  "Manga": { name: "Manga", amount: "180g", protein: 1, carbs: 28, fat: 0, calories: 110 },
  "Abacate": { name: "Abacate", amount: "100g", protein: 2, carbs: 9, fat: 15, calories: 160 },
  "Laranja": { name: "Laranja", amount: "150g", protein: 1, carbs: 15, fat: 0, calories: 62 },
  "Morango": { name: "Morango", amount: "150g", protein: 1, carbs: 12, fat: 0, calories: 48 },
  "Maçã": { name: "Maçã", amount: "150g", protein: 0, carbs: 25, fat: 0, calories: 95 },
  "Abacaxi": { name: "Abacaxi", amount: "150g", protein: 1, carbs: 20, fat: 0, calories: 75 },

  // Sweets
  "Açaí": { name: "Açaí com xarope de guaraná", amount: "200ml", protein: 3, carbs: 45, fat: 5, calories: 230 },
  "Doce de leite": { name: "Doce de leite", amount: "30g", protein: 2, carbs: 18, fat: 3, calories: 100 },
  "Leite condensado": { name: "Leite condensado", amount: "30g", protein: 2, carbs: 17, fat: 3, calories: 100 },
  "Sucrilhos": { name: "Sucrilhos", amount: "40g", protein: 2, carbs: 34, fat: 0, calories: 150 },
  "Chocolate": { name: "Chocolate 70%", amount: "25g", protein: 2, carbs: 12, fat: 9, calories: 135 },

  // Supplements
  "Whey Protein": { name: "Whey Protein", amount: "1 scoop (30g)", protein: 25, carbs: 3, fat: 1, calories: 120 },
  "Creatina": { name: "Creatina", amount: "5g", protein: 0, carbs: 0, fat: 0, calories: 0 },
};

function getFood(name: string): FoodItem {
  return FOOD_DB[name] || { name, amount: "1 porção", protein: 0, carbs: 0, fat: 0, calories: 0 };
}

function pickPreferred(options: string[], preferred: string[], disliked: string, allergies: string[]): string {
  const dislikedLower = (disliked || "").toLowerCase();
  const allergySet = new Set((allergies || []).map(a => a.toLowerCase()));

  // Filter out disliked and allergens
  const filtered = options.filter(o => {
    const lower = o.toLowerCase();
    if (dislikedLower.includes(lower)) return false;
    if (allergySet.has("celíaco (glúten)") && ["Pão de forma", "Pão francês", "Pão de hambúrguer", "Macarrão", "Aveia", "Granola"].includes(o)) return false;
    if (allergySet.has("intolerância à lactose") && ["Leite desnatado", "Leite semi desnatado", "Queijo", "Iogurte desnatado", "Requeijão light", "Whey Protein"].includes(o)) return false;
    if (allergySet.has("alergia a ovo") && o === "Ovo") return false;
    if (allergySet.has("alergia a frutos do mar") && ["Salmão", "Tilápia", "Atum"].includes(o)) return false;
    if (allergySet.has("alergia a proteína do soro do leite") && o === "Whey Protein") return false;
    return true;
  });

  // STRICT: only use foods the user actually selected
  const preferredSet = new Set(preferred);
  const userSelected = filtered.filter(o => preferredSet.has(o));
  if (userSelected.length > 0) return userSelected[0];

  // Last-resort fallback only if user didn't pick anything in this category
  return filtered[0] || options[0];
}

function filterList(options: string[], preferred: string[], disliked: string, allergies: string[]): string[] {
  const dislikedLower = (disliked || "").toLowerCase();
  const allergySet = new Set((allergies || []).map(a => a.toLowerCase()));
  const preferredSet = new Set(preferred);

  const safe = options.filter(o => {
    const lower = o.toLowerCase();
    if (dislikedLower.includes(lower)) return false;
    if (allergySet.has("celíaco (glúten)") && ["Pão de forma", "Pão francês", "Pão de hambúrguer", "Macarrão", "Aveia", "Granola"].includes(o)) return false;
    if (allergySet.has("intolerância à lactose") && ["Leite desnatado", "Leite semi desnatado", "Queijo", "Iogurte desnatado", "Requeijão light", "Whey Protein"].includes(o)) return false;
    if (allergySet.has("alergia a ovo") && o === "Ovo") return false;
    if (allergySet.has("alergia a frutos do mar") && ["Salmão", "Tilápia", "Atum"].includes(o)) return false;
    if (allergySet.has("alergia a proteína do soro do leite") && o === "Whey Protein") return false;
    return true;
  });

  // STRICT: restrict to user-selected foods when available
  const userSelected = safe.filter(o => preferredSet.has(o));
  return userSelected.length > 0 ? userSelected : safe;
}

function generateDiet(p: Profile) {
  const weight = p.weight || 80;
  const goal = p.goal || "Hipertrofia";
  const sex = p.sex || "M";
  const mealCount = p.meal_count || 4;
  const preferred = p.preferred_foods || [];
  const disliked = p.disliked_foods || "";
  const allergies = (p.allergies || "").split(",").map(a => a.trim()).filter(Boolean);
  const sweet = p.sweet_preference || "Nenhum";
  const supplements = p.supplements || [];
  const trainingTime = p.training_time || "Manhã (antes das 10h)";

  // BMR + TDEE
  let bmr = sex === "M" ? weight * 24 : weight * 22;
  const activityMap: Record<string, number> = {
    "Sedentário": 1.2,
    "Levemente ativo": 1.375,
    "Moderadamente ativo": 1.55,
    "Muito ativo": 1.725,
    "Extremamente ativo": 1.9,
  };
  const multiplier = activityMap[p.activity_level || "Moderadamente ativo"] || 1.55;
  let tdee = Math.round(bmr * multiplier);
  if (goal === "Emagrecimento") tdee -= 400;
  else if (goal === "Hipertrofia") tdee += 300;

  const proteinG = Math.round(weight * 2);
  const fatG = Math.round(weight * 0.9);
  const carbsG = Math.round((tdee - proteinG * 4 - fatG * 9) / 4);

  // Determine carb front loading timing
  // Training time → 2 meals before training get most carbs, 1 meal after gets carbs too
  const isTrainingMorning = trainingTime.includes("Manhã");
  const isTrainingNoon = trainingTime.includes("Meio-dia");
  const isTrainingAfternoon = trainingTime.includes("Tarde");
  // default: night

  // Available foods filtered by preferences
  const carbBreakfast = filterList(["Pão de forma", "Pão francês", "Tapioca", "Cuscuz", "Rap10"], preferred, disliked, allergies);
  const carbMain = filterList(["Arroz", "Batata inglesa", "Macarrão", "Mandioca", "Batata doce"], preferred, disliked, allergies);
  const protBreakfast = filterList(["Ovo", "Peito de frango", "Atum", "Queijo"], preferred, disliked, allergies);
  const protMain = filterList(["Peito de frango", "Patinho", "Coxão mole", "Tilápia", "Sobrecoxa sem pele", "Salmão", "Músculo"], preferred, disliked, allergies);
  const protSnack = filterList(["Peito de frango", "Atum", "Ovo"], preferred, disliked, allergies);
  const fruits = filterList(["Banana", "Maçã", "Mamão", "Morango", "Melão", "Abacaxi", "Manga", "Laranja"], preferred, disliked, allergies);
  const dairy = filterList(["Iogurte desnatado", "Leite desnatado", "Leite semi desnatado"], preferred, disliked, allergies);

  const pick = (arr: string[]) => pickPreferred(arr, preferred, disliked, allergies);

  // Build meals based on mealCount
  const meals: Meal[] = [];

  // Helper to tag carb intensity
  // carb front loading: heavy carbs 2 meals before training, moderate in post-training meal
  const getMealTimes = (count: number) => {
    if (count === 3) return [
      { label: "Café da manhã", time: "07:00" },
      { label: "Almoço", time: "12:00" },
      { label: "Jantar", time: "20:00" },
    ];
    if (count === 4) return [
      { label: "Café da manhã", time: "07:00" },
      { label: "Almoço", time: "12:00" },
      { label: "Lanche da tarde", time: "16:00" },
      { label: "Jantar", time: "20:00" },
    ];
    if (count === 5) return [
      { label: "Café da manhã", time: "07:00" },
      { label: "Lanche da manhã", time: "10:00" },
      { label: "Almoço", time: "12:00" },
      { label: "Lanche da tarde", time: "16:00" },
      { label: "Jantar", time: "20:00" },
    ];
    return [
      { label: "Café da manhã", time: "07:00" },
      { label: "Lanche da manhã", time: "10:00" },
      { label: "Almoço", time: "12:00" },
      { label: "Lanche da tarde", time: "15:30" },
      { label: "Pré-treino", time: "17:30" },
      { label: "Jantar", time: "20:00" },
    ];
  };

  const mealSlots = getMealTimes(mealCount);

  for (let i = 0; i < mealSlots.length; i++) {
    const slot = mealSlots[i];
    const isBreakfast = slot.label.includes("Café");
    const isLunch = slot.label.includes("Almoço");
    const isDinner = slot.label.includes("Jantar");
    const isSnack = slot.label.includes("Lanche") || slot.label.includes("Pré-treino");

    if (isBreakfast) {
      const c1 = pick(carbBreakfast);
      const c2 = carbBreakfast.find(c => c !== c1) || c1;
      const c3 = carbBreakfast.find(c => c !== c1 && c !== c2) || c1;
      const p1 = pick(protBreakfast);
      const p2 = protBreakfast.find(p => p !== p1) || p1;
      const fruit = pick(fruits);
      const fruit2 = fruits.find(f => f !== fruit) || fruit;
      const dairyItem = dairy.length > 0 ? pick(dairy) : null;

      const opt1Foods = [getFood(c1), getFood(p1), getFood(fruit)];
      if (dairyItem) opt1Foods.push(getFood(dairyItem));

      const opt2Foods = [getFood(c2), getFood(p2), getFood(fruit2)];
      if (dairyItem) opt2Foods.push(getFood(dairyItem));

      const opt3Foods = [getFood(c3), getFood(p1), getFood(fruit)];
      if (sweet !== "Nenhum") opt3Foods.push(getFood(sweet));
      else if (dairyItem) opt3Foods.push(getFood(dairyItem));

      meals.push({
        ...slot,
        options: [
          { label: "Opção 1", foods: opt1Foods },
          { label: "Opção 2", foods: opt2Foods },
          { label: "Opção 3", foods: opt3Foods },
        ],
        substitutions: [
          { category: "Carboidrato", options: carbBreakfast },
          { category: "Proteína", options: protBreakfast },
          { category: "Fruta", options: fruits },
        ],
      });
    } else if (isLunch) {
      const c1 = pick(carbMain);
      const c2 = carbMain.find(c => c !== c1) || c1;
      const c3 = carbMain.find(c => c !== c1 && c !== c2) || c1;
      const p1 = pick(protMain);
      const p2 = protMain.find(p => p !== p1) || p1;
      const p3 = protMain.find(p => p !== p1 && p !== p2) || p1;

      meals.push({
        ...slot,
        options: [
          { label: "Opção 1", foods: [getFood(c1), getFood("Feijão"), getFood(p1), getFood("Vegetais")] },
          { label: "Opção 2", foods: [getFood(c2), getFood("Feijão"), getFood(p2), getFood("Vegetais")] },
          { label: "Opção 3", foods: [getFood(c3), getFood("Lentilha"), getFood(p3), getFood("Vegetais")] },
        ],
        substitutions: [
          { category: "Carboidrato", options: carbMain },
          { category: "Proteína", options: protMain },
          { category: "Leguminosa", options: filterList(["Feijão", "Lentilha"], preferred, disliked, allergies) },
        ],
      });
    } else if (isDinner) {
      // Jantar: REPETIR formato de almoço (combinações brasileiras: prato feito).
      // NUNCA misturar carbo de café (pão/wrap) com proteína de almoço (carne/peixe) + arroz.
      const c1 = pick(carbMain);
      const c2 = carbMain.find(c => c !== c1) || c1;
      const c3 = carbMain.find(c => c !== c1 && c !== c2) || c1;
      const p1 = protMain.length > 1 ? protMain[1] : pick(protMain);
      const p2 = protMain.length > 2 ? protMain[2] : pick(protMain);
      const p3 = protMain.length > 0 ? protMain[0] : pick(protMain);
      const fruit = fruits.length > 1 ? fruits[1] : pick(fruits);

      meals.push({
        ...slot,
        options: [
          { label: "Opção 1", foods: [getFood(c1), getFood("Feijão"), getFood(p1), getFood("Vegetais"), getFood(fruit)] },
          { label: "Opção 2", foods: [getFood(c2), getFood("Feijão"), getFood(p2), getFood("Vegetais"), getFood(fruit)] },
          { label: "Opção 3", foods: [getFood(c3), getFood("Lentilha"), getFood(p3), getFood("Vegetais"), getFood(fruit)] },
        ],
        substitutions: [
          { category: "Carboidrato", options: carbMain },
          { category: "Proteína", options: protMain },
          { category: "Fruta", options: fruits },
        ],
      });
    } else if (isSnack) {
      const hasWhey = supplements.includes("Whey Protein") && !allergies.some(a => a.toLowerCase().includes("soro do leite"));
      const fruit = fruits.length > 2 ? fruits[2] : pick(fruits);
      const fruit2 = fruits.length > 3 ? fruits[3] : pick(fruits);
      const carbSnack = pick(carbBreakfast);
      const carbSnack2 = carbBreakfast.find(c => c !== carbSnack) || carbSnack;
      const protSnackItem = pick(protSnack);

      const opt1: FoodItem[] = [];
      const opt2: FoodItem[] = [];
      const opt3: FoodItem[] = [];

      // Filter grain/cereal options respecting dislikes
      const grainOptions = filterList(["Aveia", "Granola", "Tapioca"], preferred, disliked, allergies);
      const grainPick = grainOptions.length > 0 ? grainOptions[0] : null;

      if (hasWhey) {
        opt1.push(getFood("Whey Protein"), getFood(fruit));
        if (grainPick) opt1.push(getFood(grainPick));
        opt2.push(getFood(carbSnack), getFood(protSnackItem), getFood(fruit));
        opt3.push(getFood("Whey Protein"), getFood(fruit2));
        const dairySnack = dairy.length > 0 ? pick(dairy) : null;
        if (dairySnack) opt3.push(getFood(dairySnack));
      } else {
        opt1.push(getFood(carbSnack), getFood(protSnackItem), getFood(fruit));
        opt2.push(getFood(carbSnack2), getFood(protSnackItem), getFood(fruit2));
        const dairySnack = dairy.length > 0 ? pick(dairy) : null;
        if (dairySnack) {
          opt3.push(getFood(dairySnack), getFood(fruit));
          if (grainPick) opt3.push(getFood(grainPick));
        } else {
          opt3.push(getFood(carbSnack), getFood(fruit));
        }
      }

      // Add sweet to last snack option
      if (sweet !== "Nenhum" && i === mealSlots.length - 2 && !isTrainingMorning) {
        opt3.push(getFood(sweet));
      }

      meals.push({
        ...slot,
        options: [
          { label: "Opção 1", foods: opt1 },
          { label: "Opção 2", foods: opt2 },
          { label: "Opção 3", foods: opt3 },
        ],
        substitutions: [
          { category: "Carboidrato", options: carbBreakfast },
          { category: "Proteína", options: [...protSnack, ...(hasWhey ? ["Whey Protein"] : [])] },
          { category: "Fruta", options: fruits },
        ],
      });
    }
  }

  // Add supplement notes with correct dosages
  const notes: string[] = [];
  if (supplements.includes("Creatina")) {
    const creatinaDose = sex === "F" ? "5g" : "7g";
    notes.push(`Creatina: ${creatinaDose} por dia, pode tomar a qualquer hora com água.`);
  }
  if (supplements.includes("Vitamina C")) notes.push("Vitamina C: 1g por dia.");
  if (supplements.includes("Vitamina D")) notes.push("Vitamina D: 6000UI por dia, junto com refeição com gordura.");
  if (supplements.includes("Ômega 3")) notes.push("Ômega 3: 1-2g EPA+DHA por dia, junto com refeição.");
  if (supplements.includes("Whey Protein")) notes.push("Whey Protein: usado como complemento proteico na dieta. Dose conforme necessidade de encaixe de macros.");

  return {
    totalCalories: tdee,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    meals,
    notes,
    carbFrontLoading: `Método carb front loading: maioria dos carboidratos nas 2 refeições antes do treino (${trainingTime}) e na refeição pós-treino.`,
  };
}
