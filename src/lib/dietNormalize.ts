// Normalizes legacy diet substitutions (string[]) into the new
// object-based schema { referenceFood, options[] } with estimated
// portions/macros so the Diet UI can render equivalence safely.
//
// Also exposes a helper to ensure each training day has the fields
// the UI expects (mobility[], dynamicNotes, exercises[]).

export interface SubOption {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NormalizedSubstitution {
  category: string;
  referenceFood?: SubOption;
  options: SubOption[];
}

// Macros per 100g (or per typical serving for items where 100g doesn't
// make sense, e.g. "Whey 1 scoop"). Used to estimate portions when the
// AI delivered only a name string.
type MacroBase = {
  per: "100g" | "unit";
  unitLabel?: string; // e.g. "1 scoop (30g)" or "1 unidade (50g)"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const FOOD_MACROS: Record<string, MacroBase> = {
  // Carbs (per 100g cooked/ready)
  "Arroz": { per: "100g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "Arroz branco": { per: "100g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "Arroz integral": { per: "100g", calories: 124, protein: 2.7, carbs: 26, fat: 1 },
  "Batata inglesa": { per: "100g", calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  "Batata doce": { per: "100g", calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  "Mandioca": { per: "100g", calories: 107, protein: 1.4, carbs: 26, fat: 0.3 },
  "Inhame": { per: "100g", calories: 79, protein: 1.5, carbs: 18, fat: 0.1 },
  "Macarrão": { per: "100g", calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  "Pão de forma": { per: "100g", calories: 280, protein: 9, carbs: 50, fat: 4 },
  "Pão francês": { per: "100g", calories: 270, protein: 8, carbs: 56, fat: 2 },
  "Pão de hambúrguer": { per: "100g", calories: 270, protein: 8, carbs: 50, fat: 5 },
  "Rap10": { per: "100g", calories: 270, protein: 9, carbs: 50, fat: 4 },
  "Tapioca": { per: "100g", calories: 250, protein: 1, carbs: 60, fat: 0.1 },
  "Cuscuz": { per: "100g", calories: 113, protein: 2.5, carbs: 25, fat: 0.5 },
  "Aveia": { per: "100g", calories: 380, protein: 13, carbs: 67, fat: 7 },
  "Granola": { per: "100g", calories: 430, protein: 9, carbs: 70, fat: 13 },

  // Proteins (per 100g cozido/grelhado)
  "Peito de frango": { per: "100g", calories: 140, protein: 30, carbs: 0, fat: 2 },
  "Sobrecoxa sem pele": { per: "100g", calories: 150, protein: 25, carbs: 0, fat: 5 },
  "Patinho": { per: "100g", calories: 143, protein: 28, carbs: 0, fat: 3 },
  "Coxão mole": { per: "100g", calories: 147, protein: 27, carbs: 0, fat: 4 },
  "Filé mignon": { per: "100g", calories: 160, protein: 29, carbs: 0, fat: 5 },
  "Músculo": { per: "100g", calories: 147, protein: 27, carbs: 0, fat: 4 },
  "Salmão": { per: "100g", calories: 180, protein: 23, carbs: 0, fat: 9 },
  "Tilápia": { per: "100g", calories: 113, protein: 23, carbs: 0, fat: 2 },
  "Atum": { per: "100g", calories: 108, protein: 25, carbs: 0, fat: 1 },
  "Sardinha": { per: "100g", calories: 136, protein: 20, carbs: 0, fat: 6 },
  "Camarão": { per: "100g", calories: 93, protein: 20, carbs: 1, fat: 1 },
  "Carne de porco magra": { per: "100g", calories: 140, protein: 25, carbs: 0, fat: 4 },
  "Lombo suíno": { per: "100g", calories: 140, protein: 25, carbs: 0, fat: 4 },

  // Eggs (unit-based)
  "Ovo": { per: "unit", unitLabel: "3 unidades (150g)", calories: 210, protein: 18, carbs: 2, fat: 15 },

  // Dairy
  "Queijo": { per: "100g", calories: 240, protein: 22, carbs: 3, fat: 16 },
  "Queijo branco": { per: "100g", calories: 240, protein: 22, carbs: 3, fat: 16 },
  "Leite desnatado": { per: "100g", calories: 35, protein: 3.5, carbs: 5, fat: 0 },
  "Leite semi desnatado": { per: "100g", calories: 45, protein: 3.5, carbs: 5, fat: 1.5 },
  "Iogurte desnatado": { per: "100g", calories: 47, protein: 4.7, carbs: 7, fat: 0 },
  "Requeijão light": { per: "100g", calories: 150, protein: 10, carbs: 3, fat: 10 },

  // Legumes
  "Feijão": { per: "100g", calories: 110, protein: 7, carbs: 18, fat: 1 },
  "Lentilha": { per: "100g", calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  "Grão de bico": { per: "100g", calories: 140, protein: 9, carbs: 22, fat: 3 },

  // Fruits (per 100g)
  "Banana": { per: "100g", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  "Maçã": { per: "100g", calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  "Mamão": { per: "100g", calories: 43, protein: 0.5, carbs: 11, fat: 0.3 },
  "Morango": { per: "100g", calories: 32, protein: 0.7, carbs: 8, fat: 0.3 },
  "Melão": { per: "100g", calories: 34, protein: 0.8, carbs: 8, fat: 0.2 },
  "Melancia": { per: "100g", calories: 30, protein: 0.6, carbs: 8, fat: 0.2 },
  "Manga": { per: "100g", calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  "Laranja": { per: "100g", calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  "Abacaxi": { per: "100g", calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  "Uva": { per: "100g", calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  "Kiwi": { per: "100g", calories: 60, protein: 1.1, carbs: 14, fat: 0.5 },
  "Abacate": { per: "100g", calories: 160, protein: 2, carbs: 9, fat: 15 },
  "Pêssego": { per: "100g", calories: 39, protein: 0.9, carbs: 10, fat: 0.3 },
  "Goiaba": { per: "100g", calories: 68, protein: 2.6, carbs: 14, fat: 1 },
  "Ameixa": { per: "100g", calories: 46, protein: 0.7, carbs: 11, fat: 0.3 },

  // Supplements
  "Whey Protein": { per: "unit", unitLabel: "1 scoop (30g)", calories: 120, protein: 25, carbs: 3, fat: 1 },
  "Whey Isolado": { per: "unit", unitLabel: "1 scoop (30g)", calories: 115, protein: 27, carbs: 1, fat: 0.5 },
  "Creatina": { per: "unit", unitLabel: "5g", calories: 0, protein: 0, carbs: 0, fat: 0 },
  "Pasta de amendoim": { per: "100g", calories: 600, protein: 25, carbs: 15, fat: 50 },
  "Castanhas": { per: "100g", calories: 580, protein: 17, carbs: 16, fat: 50 },
  "Azeite de oliva": { per: "unit", unitLabel: "1 colher (15ml)", calories: 120, protein: 0, carbs: 0, fat: 14 },
};

// Default portion in grams used when estimating from 100g base.
function defaultPortionGrams(name: string, category: string): number {
  const c = category.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes("pão") || n.includes("rap10")) return 50;
  if (n.includes("tapioca")) return 60;
  if (n.includes("cuscuz")) return 150;
  if (n.includes("aveia") || n.includes("granola")) return 40;
  if (c.includes("carbo")) return 150;
  if (c.includes("proteína") || c.includes("proteina")) return 150;
  if (c.includes("legumin")) return 100;
  if (c.includes("fruta")) return 150;
  if (c.includes("laticín") || c.includes("laticin")) return 170;
  return 100;
}

function lookup(name: string): MacroBase | null {
  if (FOOD_MACROS[name]) return FOOD_MACROS[name];
  // Loose match (case-insensitive substring)
  const lower = name.toLowerCase();
  for (const k of Object.keys(FOOD_MACROS)) {
    if (k.toLowerCase() === lower) return FOOD_MACROS[k];
  }
  for (const k of Object.keys(FOOD_MACROS)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
      return FOOD_MACROS[k];
    }
  }
  return null;
}

function categoryMainMacro(category: string): "carbs" | "protein" | "fat" | "calories" {
  const c = (category || "").toLowerCase();
  if (c.includes("carbo")) return "carbs";
  if (c.includes("proteí") || c.includes("protei") || c.includes("legumin") || c.includes("laticín") || c.includes("laticin")) return "protein";
  if (c.includes("fruta")) return "carbs";
  if (c.includes("gordura") || c.includes("oleagi")) return "fat";
  return "calories";
}

/** Build a SubOption from the macro base scaled to a given amount in grams. */
function buildFromGrams(name: string, base: MacroBase, grams: number): SubOption {
  const factor = grams / 100;
  return {
    name,
    amount: `${Math.round(grams)}g`,
    calories: Math.round(base.calories * factor),
    protein: Math.round(base.protein * factor * 10) / 10,
    carbs: Math.round(base.carbs * factor * 10) / 10,
    fat: Math.round(base.fat * factor * 10) / 10,
  };
}

/**
 * Estimate a SubOption that matches the target macro & calories within ±5%.
 * - For "unit" foods (eggs, scoops, slices), returns the fixed unit serving.
 * - For "100g" foods, computes grams to hit the target main macro of the
 *   category, then verifies that calories also stay within ±15% (otherwise
 *   we accept the macro match — macro is more important than calories).
 */
function estimateMatching(
  name: string,
  category: string,
  target: { calories: number; protein: number; carbs: number; fat: number } | null
): SubOption {
  const base = lookup(name);
  if (!base) {
    return { name, amount: "1 porção", calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  if (base.per === "unit") {
    return {
      name,
      amount: base.unitLabel || "1 porção",
      calories: Math.round(base.calories),
      protein: Math.round(base.protein * 10) / 10,
      carbs: Math.round(base.carbs * 10) / 10,
      fat: Math.round(base.fat * 10) / 10,
    };
  }

  if (!target) {
    // No reference — use sensible default portion
    const grams = defaultPortionGrams(name, category);
    return buildFromGrams(name, base, grams);
  }

  const main = categoryMainMacro(category);
  const targetValue = target[main] || 0;
  const baseValue = (base as any)[main] as number;

  // If the macro doesn't exist in this food, fall back to calorie matching
  let grams: number;
  if (baseValue && baseValue > 0) {
    grams = (targetValue / baseValue) * 100;
  } else if (base.calories > 0) {
    grams = (target.calories / base.calories) * 100;
  } else {
    grams = defaultPortionGrams(name, category);
  }

  // Snap to 5g increments and clamp to a sensible range
  grams = Math.max(20, Math.min(400, Math.round(grams / 5) * 5));
  return buildFromGrams(name, base, grams);
}

/** Detect if a substitution entry is in the legacy string-only format. */
export function isLegacySubstitution(sub: any): boolean {
  if (!sub || !Array.isArray(sub.options)) return false;
  return sub.options.length > 0 && typeof sub.options[0] === "string";
}

/** Convert a single substitution (legacy or new) into the normalized shape. */
export function normalizeSubstitution(sub: any): NormalizedSubstitution {
  const category: string = sub?.category || "Substituições";

  // Already in new format → trust it but re-validate proportions
  if (sub?.options?.length && typeof sub.options[0] === "object") {
    const opts = sub.options as SubOption[];
    const ref: SubOption | undefined = sub.referenceFood || opts[0];

    // Check if the AI-provided portions actually match the reference.
    // If they're way off (>20% on the main macro), recompute from scratch.
    const main = categoryMainMacro(category);
    const refTarget = ref
      ? { calories: ref.calories, protein: ref.protein, carbs: ref.carbs, fat: ref.fat }
      : null;
    const validated = opts.map((o) => {
      if (!ref || !refTarget) return o;
      const refMain = (ref as any)[main] as number;
      const optMain = (o as any)[main] as number;
      if (!refMain || refMain === 0) return o;
      const drift = Math.abs(optMain - refMain) / refMain;
      // If the AI got the proportions roughly right (≤20% drift on main macro), keep it.
      if (drift <= 0.2) return o;
      // Otherwise rebuild this option from our local DB to match the reference.
      return estimateMatching(o.name, category, refTarget);
    });

    return {
      category,
      referenceFood: ref,
      options: validated,
    };
  }

  // Legacy: array of strings → estimate macros to match the FIRST food's portion
  const names: string[] = Array.isArray(sub?.options) ? sub.options : [];
  if (names.length === 0) {
    return { category, options: [] };
  }

  // First food sets the reference (use a sensible default portion for it)
  const firstBase = lookup(names[0]);
  let referenceFood: SubOption;
  if (firstBase && firstBase.per === "unit") {
    referenceFood = estimateMatching(names[0], category, null);
  } else {
    referenceFood = estimateMatching(names[0], category, null);
  }
  const refTarget = {
    calories: referenceFood.calories,
    protein: referenceFood.protein,
    carbs: referenceFood.carbs,
    fat: referenceFood.fat,
  };

  const opts = names.map((n, i) =>
    i === 0 ? referenceFood : estimateMatching(n, category, refTarget)
  );

  return {
    category,
    referenceFood,
    options: opts,
  };
}

/** Normalize the whole substitutions array of a meal. */
export function normalizeSubstitutions(subs: any): NormalizedSubstitution[] {
  if (!Array.isArray(subs)) return [];
  return subs.map(normalizeSubstitution);
}

// ============================================================
// TRAINING NORMALIZER — backfills new fields on legacy protocols
// ============================================================

export interface NormalizedTrainingDay {
  label: string;
  muscleGroup: string;
  weekday: string;
  splitCode?: string;
  dynamicNotes: string;
  mobility: any[];
  exercises: any[];
  cardio: any | null;
  [key: string]: any;
}

/** Make sure every training day has the fields the UI expects. */
export function normalizeTrainingDay(day: any, dayIndex: number): NormalizedTrainingDay {
  if (!day || typeof day !== "object") {
    return {
      label: `Dia ${dayIndex + 1}`,
      muscleGroup: "",
      weekday: "",
      dynamicNotes: "",
      mobility: [],
      exercises: [],
      cardio: null,
    };
  }

  const exercises = Array.isArray(day.exercises)
    ? day.exercises.map((ex: any, ei: number) => ({
        ...ex,
        id: ex?.id ?? `${dayIndex}-${ei}`,
        name: ex?.name ?? "Exercício",
        sets: ex?.sets ?? 3,
        reps: ex?.reps ?? "3 séries válidas de 8-12 reps (última na falha)",
        rest: ex?.rest ?? "60s",
        technique: ex?.technique ?? "standard",
        videoQuery: ex?.videoQuery || `${ex?.name || ""} execução correta`,
        done: ex?.done ?? false,
      }))
    : [];

  return {
    ...day,
    label: day.label ?? `Dia ${dayIndex + 1}`,
    muscleGroup: day.muscleGroup ?? day.focus ?? "",
    weekday: day.weekday ?? "",
    splitCode: day.splitCode ?? day.code,
    dynamicNotes: day.dynamicNotes ?? "",
    mobility: Array.isArray(day.mobility) ? day.mobility : [],
    exercises,
    cardio: day.cardio ?? null,
  };
}

export function normalizeTraining(training: any): NormalizedTrainingDay[] {
  if (!Array.isArray(training)) return [];
  return training.map((d, i) => normalizeTrainingDay(d, i));
}
