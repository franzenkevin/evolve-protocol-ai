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

function generateTraining(p: Profile) {
  const days = p.training_days || 4;
  const level = p.experience || "Iniciante";
  const goal = p.goal || "Hipertrofia";

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

  const exerciseDB: Record<string, { name: string; sets: number; reps: string; rest: string }[]> = {
    "Peito": [
      { name: "Supino reto com barra", sets: 4, reps: "8-12", rest: "90s" },
      { name: "Supino inclinado halteres", sets: 3, reps: "10-12", rest: "90s" },
      { name: "Crucifixo máquina", sets: 3, reps: "12-15", rest: "60s" },
      { name: "Crossover", sets: 3, reps: "12-15", rest: "60s" },
    ],
    "Costas": [
      { name: "Puxada frontal", sets: 4, reps: "8-12", rest: "90s" },
      { name: "Remada curvada", sets: 4, reps: "8-12", rest: "90s" },
      { name: "Remada unilateral", sets: 3, reps: "10-12", rest: "60s" },
      { name: "Pulldown corda", sets: 3, reps: "12-15", rest: "60s" },
    ],
    "Pernas (Quad)": [
      { name: "Agachamento livre", sets: 4, reps: "8-10", rest: "120s" },
      { name: "Leg press 45°", sets: 4, reps: "10-12", rest: "90s" },
      { name: "Cadeira extensora", sets: 3, reps: "12-15", rest: "60s" },
      { name: "Passada com halteres", sets: 3, reps: "12/lado", rest: "60s" },
    ],
    "Ombros": [
      { name: "Desenvolvimento com halteres", sets: 4, reps: "8-12", rest: "90s" },
      { name: "Elevação lateral", sets: 3, reps: "12-15", rest: "60s" },
      { name: "Elevação frontal", sets: 3, reps: "12-15", rest: "60s" },
      { name: "Face pull", sets: 3, reps: "15-20", rest: "60s" },
    ],
    "Tríceps": [
      { name: "Tríceps pulley corda", sets: 3, reps: "12-15", rest: "60s" },
      { name: "Tríceps testa barra EZ", sets: 3, reps: "10-12", rest: "60s" },
      { name: "Mergulho no banco", sets: 3, reps: "falha", rest: "60s" },
    ],
    "Bíceps": [
      { name: "Rosca direta barra", sets: 3, reps: "10-12", rest: "60s" },
      { name: "Rosca martelo", sets: 3, reps: "12-15", rest: "60s" },
      { name: "Rosca concentrada", sets: 3, reps: "12-15", rest: "60s" },
    ],
    "Pernas (Post)": [
      { name: "Stiff", sets: 4, reps: "8-12", rest: "90s" },
      { name: "Mesa flexora", sets: 3, reps: "12-15", rest: "60s" },
      { name: "Elevação pélvica", sets: 3, reps: "12-15", rest: "60s" },
    ],
    "Core": [
      { name: "Prancha", sets: 3, reps: "45s", rest: "30s" },
      { name: "Abdominal infra", sets: 3, reps: "15-20", rest: "30s" },
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

function generateDiet(p: Profile) {
  const weight = p.weight || 80;
  const goal = p.goal || "Hipertrofia";
  const sex = p.sex || "M";

  // BMR (Mifflin-St Jeor simplified)
  let bmr = sex === "M" ? weight * 24 : weight * 22;

  // Activity multiplier
  const activityMap: Record<string, number> = {
    "Sedentário": 1.2,
    "Levemente ativo": 1.375,
    "Moderadamente ativo": 1.55,
    "Muito ativo": 1.725,
    "Extremamente ativo": 1.9,
  };
  const multiplier = activityMap[p.activity_level || "Moderadamente ativo"] || 1.55;
  let tdee = Math.round(bmr * multiplier);

  // Goal adjustment
  if (goal === "Emagrecimento") tdee -= 400;
  else if (goal === "Hipertrofia") tdee += 300;

  // Macros
  const proteinG = Math.round(weight * 2);
  const fatG = Math.round(weight * 0.9);
  const proteinCal = proteinG * 4;
  const fatCal = fatG * 9;
  const carbsCal = tdee - proteinCal - fatCal;
  const carbsG = Math.round(carbsCal / 4);

  const meals = [
    {
      label: "Café da manhã",
      time: "07:00",
      foods: [
        { name: "Ovos mexidos", amount: "3 unidades", protein: 18, carbs: 2, fat: 15, calories: 210 },
        { name: "Pão integral", amount: "2 fatias", protein: 6, carbs: 24, fat: 2, calories: 140 },
        { name: "Banana", amount: "1 unidade", protein: 1, carbs: 27, fat: 0, calories: 105 },
      ],
    },
    {
      label: "Almoço",
      time: "12:00",
      foods: [
        { name: "Frango grelhado", amount: "200g", protein: 46, carbs: 0, fat: 6, calories: 240 },
        { name: "Arroz branco", amount: "150g", protein: 4, carbs: 45, fat: 0, calories: 195 },
        { name: "Feijão", amount: "100g", protein: 8, carbs: 20, fat: 1, calories: 120 },
        { name: "Salada verde", amount: "à vontade", protein: 1, carbs: 3, fat: 0, calories: 15 },
      ],
    },
    {
      label: "Lanche da tarde",
      time: "16:00",
      foods: [
        { name: "Whey Protein", amount: "1 scoop", protein: 25, carbs: 3, fat: 1, calories: 120 },
        { name: "Aveia", amount: "40g", protein: 5, carbs: 28, fat: 3, calories: 150 },
        { name: "Morango", amount: "100g", protein: 1, carbs: 8, fat: 0, calories: 33 },
      ],
    },
    {
      label: "Jantar",
      time: "20:00",
      foods: [
        { name: "Carne moída magra", amount: "200g", protein: 40, carbs: 0, fat: 12, calories: 268 },
        { name: "Batata doce", amount: "200g", protein: 2, carbs: 40, fat: 0, calories: 172 },
        { name: "Brócolis", amount: "100g", protein: 3, carbs: 7, fat: 0, calories: 34 },
      ],
    },
  ];

  return {
    totalCalories: tdee,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    meals,
  };
}
