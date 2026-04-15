import type { Profile } from "@/hooks/useProfile";

/**
 * Generates a default training + diet protocol based on user profile.
 * This is a rule-based generator — AI enhancement comes in Phase 2.
 */
export function generateProtocol(profile: Profile) {
  const training = generateTraining(profile);
  const diet = generateDiet(profile);
  return { training, diet };
}

// ==================== TRAINING (unchanged) ====================

function generateTraining(p: Profile) {
  const days = p.training_days || 4;

  const templates: Record<number, { label: string; muscleGroup: string }[]> = {
    2: [
      { label: "Dia A", muscleGroup: "Full Body A" },
      { label: "Dia B", muscleGroup: "Full Body B" },
    ],
    3: [
      { label: "Dia A", muscleGroup: "Peito, Ombros & Tríceps" },
      { label: "Dia B", muscleGroup: "Costas & Bíceps" },
      { label: "Dia C", muscleGroup: "Pernas & Core" },
    ],
    4: [
      { label: "Dia A", muscleGroup: "Peito & Tríceps" },
      { label: "Dia B", muscleGroup: "Costas & Bíceps" },
      { label: "Dia C", muscleGroup: "Pernas (Quad)" },
      { label: "Dia D", muscleGroup: "Ombros & Pernas (Post)" },
    ],
    5: [
      { label: "Dia A", muscleGroup: "Peito" },
      { label: "Dia B", muscleGroup: "Costas" },
      { label: "Dia C", muscleGroup: "Pernas (Quad)" },
      { label: "Dia D", muscleGroup: "Ombros & Tríceps" },
      { label: "Dia E", muscleGroup: "Bíceps & Pernas (Post)" },
    ],
    6: [
      { label: "Dia A", muscleGroup: "Peito" },
      { label: "Dia B", muscleGroup: "Costas" },
      { label: "Dia C", muscleGroup: "Pernas (Quad)" },
      { label: "Dia D", muscleGroup: "Ombros" },
      { label: "Dia E", muscleGroup: "Braços" },
      { label: "Dia F", muscleGroup: "Pernas (Post) & Core" },
    ],
  };

  // Valid sets based on experience: beginner=1, intermediate=2, advanced=3
  const expLevel = p.experience || "Intermediário";
  const validSetsCount = expLevel === "Iniciante" ? 1 : expLevel === "Avançado" ? 3 : 2;

  const exerciseDB: Record<string, { name: string; sets: number; reps: string; rest: string }[]> = {
    "Peito": [
      { name: "Supino reto com barra", sets: validSetsCount, reps: "8-12", rest: "90s" },
      { name: "Supino inclinado halteres", sets: validSetsCount, reps: "10-12", rest: "90s" },
      { name: "Crucifixo máquina", sets: validSetsCount, reps: "12-15", rest: "60s" },
      { name: "Crossover", sets: validSetsCount, reps: "12-15", rest: "60s" },
    ],
    "Costas": [
      { name: "Puxada frontal", sets: validSetsCount, reps: "8-12", rest: "90s" },
      { name: "Remada curvada", sets: validSetsCount, reps: "8-12", rest: "90s" },
      { name: "Remada unilateral", sets: validSetsCount, reps: "10-12", rest: "60s" },
      { name: "Pulldown corda", sets: validSetsCount, reps: "12-15", rest: "60s" },
    ],
    "Pernas (Quad)": [
      { name: "Agachamento livre", sets: validSetsCount, reps: "8-10", rest: "120s" },
      { name: "Leg press 45°", sets: validSetsCount, reps: "10-12", rest: "90s" },
      { name: "Cadeira extensora", sets: validSetsCount, reps: "12-15", rest: "60s" },
      { name: "Passada com halteres", sets: validSetsCount, reps: "12/lado", rest: "60s" },
    ],
    "Ombros": [
      { name: "Desenvolvimento com halteres", sets: validSetsCount, reps: "8-12", rest: "90s" },
      { name: "Elevação lateral", sets: validSetsCount, reps: "12-15", rest: "60s" },
      { name: "Elevação frontal", sets: validSetsCount, reps: "12-15", rest: "60s" },
      { name: "Face pull", sets: validSetsCount, reps: "15-20", rest: "60s" },
    ],
    "Tríceps": [
      { name: "Tríceps pulley corda", sets: validSetsCount, reps: "12-15", rest: "60s" },
      { name: "Tríceps testa barra EZ", sets: validSetsCount, reps: "10-12", rest: "60s" },
      { name: "Mergulho no banco", sets: validSetsCount, reps: "falha", rest: "60s" },
    ],
    "Bíceps": [
      { name: "Rosca direta barra", sets: validSetsCount, reps: "10-12", rest: "60s" },
      { name: "Rosca martelo", sets: validSetsCount, reps: "12-15", rest: "60s" },
      { name: "Rosca concentrada", sets: validSetsCount, reps: "12-15", rest: "60s" },
    ],
    "Pernas (Post)": [
      { name: "Stiff", sets: validSetsCount, reps: "8-12", rest: "90s" },
      { name: "Mesa flexora", sets: validSetsCount, reps: "12-15", rest: "60s" },
      { name: "Elevação pélvica", sets: validSetsCount, reps: "12-15", rest: "60s" },
    ],
    "Core": [
      { name: "Prancha", sets: validSetsCount, reps: "45s", rest: "30s" },
      { name: "Abdominal infra", sets: validSetsCount, reps: "15-20", rest: "30s" },
    ],
  };

  const split = templates[days] || templates[4];

  return split.map((day, i) => {
    const groups = day.muscleGroup.split(/[&,]/).map((g) => g.trim());
    const exercises = groups.flatMap((g) => {
      const key = Object.keys(exerciseDB).find((k) => g.includes(k) || k.includes(g));
      return key ? exerciseDB[key] : [];
    });

    return {
      ...day,
      exercises: exercises.map((ex, j) => ({
        id: `${i}-${j}`,
        ...ex,
        done: false,
      })),
    };
  });
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

interface Meal {
  label: string;
  time: string;
  options: MealOption[];
  substitutions: { category: string; options: string[] }[];
}

// Food database with macros per typical serving
const FOOD_DB: Record<string, FoodItem> = {
  // Carbs
  "Arroz": { name: "Arroz branco", amount: "150g (cozido)", protein: 4, carbs: 42, fat: 0, calories: 195 },
  "Batata inglesa": { name: "Batata inglesa", amount: "200g (cozida)", protein: 4, carbs: 34, fat: 0, calories: 154 },
  "Batata doce": { name: "Batata doce", amount: "200g (cozida)", protein: 3, carbs: 40, fat: 0, calories: 172 },
  "Mandioca": { name: "Mandioca", amount: "150g (cozida)", protein: 2, carbs: 39, fat: 0, calories: 160 },
  "Macarrão": { name: "Macarrão", amount: "150g (cozido)", protein: 5, carbs: 44, fat: 1, calories: 200 },
  "Pão de forma": { name: "Pão de forma", amount: "2 fatias", protein: 5, carbs: 24, fat: 2, calories: 140 },
  "Pão francês": { name: "Pão francês", amount: "1 unidade", protein: 4, carbs: 28, fat: 1, calories: 135 },
  "Pão de hambúrguer": { name: "Pão de hambúrguer", amount: "1 unidade", protein: 5, carbs: 30, fat: 3, calories: 160 },
  "Rap10": { name: "Rap10", amount: "1 unidade", protein: 4, carbs: 22, fat: 2, calories: 120 },
  "Cuscuz": { name: "Cuscuz", amount: "150g", protein: 4, carbs: 38, fat: 1, calories: 170 },
  "Tapioca": { name: "Tapioca", amount: "2 unidades", protein: 1, carbs: 36, fat: 0, calories: 150 },

  // Proteins
  "Peito de frango": { name: "Peito de frango grelhado", amount: "150g", protein: 45, carbs: 0, fat: 3, calories: 210 },
  "Sobrecoxa sem pele": { name: "Sobrecoxa sem pele", amount: "150g", protein: 38, carbs: 0, fat: 8, calories: 225 },
  "Patinho": { name: "Patinho grelhado", amount: "150g", protein: 42, carbs: 0, fat: 5, calories: 215 },
  "Músculo": { name: "Músculo cozido", amount: "150g", protein: 40, carbs: 0, fat: 6, calories: 220 },
  "Filé mignon": { name: "Filé mignon grelhado", amount: "150g", protein: 43, carbs: 0, fat: 7, calories: 240 },
  "Coxão mole": { name: "Coxão mole grelhado", amount: "150g", protein: 41, carbs: 0, fat: 6, calories: 220 },
  "Salmão": { name: "Salmão grelhado", amount: "150g", protein: 34, carbs: 0, fat: 14, calories: 270 },
  "Tilápia": { name: "Tilápia grelhada", amount: "150g", protein: 35, carbs: 0, fat: 3, calories: 170 },
  "Atum": { name: "Atum em lata (drenado)", amount: "1 lata (120g)", protein: 30, carbs: 0, fat: 1, calories: 130 },
  "Ovo": { name: "Ovos", amount: "3 unidades", protein: 18, carbs: 2, fat: 15, calories: 210 },

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
  "Goiaba": { name: "Goiaba", amount: "1 unidade", protein: 2, carbs: 14, fat: 1, calories: 68 },
  "Ameixa": { name: "Ameixa", amount: "3 unidades", protein: 1, carbs: 18, fat: 0, calories: 70 },
  "Pêssego": { name: "Pêssego", amount: "1 unidade", protein: 1, carbs: 15, fat: 0, calories: 60 },
  "Grão de bico": { name: "Grão de bico", amount: "100g (cozido)", protein: 9, carbs: 22, fat: 3, calories: 140 },
  "Pasta de amendoim": { name: "Pasta de amendoim", amount: "20g", protein: 5, carbs: 3, fat: 10, calories: 120 },
  "Castanhas": { name: "Castanhas mistas", amount: "30g", protein: 5, carbs: 5, fat: 15, calories: 175 },
  "Azeite de oliva": { name: "Azeite de oliva", amount: "1 colher sopa", protein: 0, carbs: 0, fat: 14, calories: 120 },

  // Fruits
  "Banana": { name: "Banana", amount: "1 unidade", protein: 1, carbs: 27, fat: 0, calories: 105 },
  "Mamão": { name: "Mamão", amount: "1 fatia", protein: 1, carbs: 15, fat: 0, calories: 60 },
  "Melão": { name: "Melão", amount: "200g", protein: 1, carbs: 16, fat: 0, calories: 64 },
  "Melancia": { name: "Melancia", amount: "200g", protein: 1, carbs: 16, fat: 0, calories: 60 },
  "Kiwi": { name: "Kiwi", amount: "2 unidades", protein: 2, carbs: 22, fat: 1, calories: 90 },
  "Uva": { name: "Uva", amount: "150g", protein: 1, carbs: 27, fat: 0, calories: 103 },
  "Manga": { name: "Manga", amount: "1 unidade", protein: 1, carbs: 28, fat: 0, calories: 110 },
  "Abacate": { name: "Abacate", amount: "100g", protein: 2, carbs: 9, fat: 15, calories: 160 },
  "Laranja": { name: "Laranja", amount: "1 unidade", protein: 1, carbs: 15, fat: 0, calories: 62 },
  "Morango": { name: "Morango", amount: "150g", protein: 1, carbs: 12, fat: 0, calories: 48 },
  "Maçã": { name: "Maçã", amount: "1 unidade", protein: 0, carbs: 25, fat: 0, calories: 95 },
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
    // Check allergy mappings
    if (allergySet.has("celíaco (glúten)") && ["Pão de forma", "Pão francês", "Pão de hambúrguer", "Macarrão", "Aveia", "Granola"].includes(o)) return false;
    if (allergySet.has("intolerância à lactose") && ["Leite desnatado", "Leite semi desnatado", "Queijo", "Iogurte desnatado", "Requeijão light", "Whey Protein"].includes(o)) return false;
    if (allergySet.has("alergia a ovo") && o === "Ovo") return false;
    if (allergySet.has("alergia a frutos do mar") && ["Salmão", "Tilápia", "Atum"].includes(o)) return false;
    if (allergySet.has("alergia a proteína do soro do leite") && o === "Whey Protein") return false;
    return true;
  });

  // Prefer user's preferred foods
  const preferredMatch = filtered.find(o => preferred.includes(o));
  if (preferredMatch) return preferredMatch;
  return filtered[0] || options[0];
}

function filterList(options: string[], preferred: string[], disliked: string, allergies: string[]): string[] {
  const dislikedLower = (disliked || "").toLowerCase();
  const allergySet = new Set((allergies || []).map(a => a.toLowerCase()));

  return options.filter(o => {
    const lower = o.toLowerCase();
    if (dislikedLower.includes(lower)) return false;
    if (allergySet.has("celíaco (glúten)") && ["Pão de forma", "Pão francês", "Pão de hambúrguer", "Macarrão", "Aveia", "Granola"].includes(o)) return false;
    if (allergySet.has("intolerância à lactose") && ["Leite desnatado", "Leite semi desnatado", "Queijo", "Iogurte desnatado", "Requeijão light", "Whey Protein"].includes(o)) return false;
    if (allergySet.has("alergia a ovo") && o === "Ovo") return false;
    if (allergySet.has("alergia a frutos do mar") && ["Salmão", "Tilápia", "Atum"].includes(o)) return false;
    if (allergySet.has("alergia a proteína do soro do leite") && o === "Whey Protein") return false;
    return true;
  });
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
      const c1 = pick(carbMain);
      const c2 = carbMain.find(c => c !== c1) || c1;
      const p1 = protMain.length > 1 ? protMain[1] : pick(protMain);
      const p2 = protMain.length > 2 ? protMain[2] : pick(protMain);
      const fruit = fruits.length > 1 ? fruits[1] : pick(fruits);
      const carbBr = pick(carbBreakfast);

      meals.push({
        ...slot,
        options: [
          { label: "Opção 1", foods: [getFood(c1), getFood(p1), getFood("Vegetais"), getFood(fruit)] },
          { label: "Opção 2", foods: [getFood(c2), getFood(p2), getFood("Vegetais"), getFood(fruit)] },
          { label: "Opção 3", foods: [getFood(carbBr), getFood(pick(protSnack)), getFood("Vegetais"), getFood(fruit)] },
        ],
        substitutions: [
          { category: "Carboidrato", options: [...carbMain, ...carbBreakfast] },
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

      if (hasWhey) {
        opt1.push(getFood("Whey Protein"), getFood(fruit), getFood("Aveia"));
        opt2.push(getFood(carbSnack), getFood(protSnackItem), getFood(fruit));
        opt3.push(getFood("Whey Protein"), getFood(fruit2));
        const dairySnack = dairy.length > 0 ? pick(dairy) : null;
        if (dairySnack) opt3.push(getFood(dairySnack));
      } else {
        opt1.push(getFood(carbSnack), getFood(protSnackItem), getFood(fruit));
        opt2.push(getFood(carbSnack2), getFood(protSnackItem), getFood(fruit2));
        const dairySnack = dairy.length > 0 ? pick(dairy) : null;
        if (dairySnack) {
          opt3.push(getFood(dairySnack), getFood(fruit), getFood("Aveia"));
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
