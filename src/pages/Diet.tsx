import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";

interface FoodItem {
  name: string;
  amount: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface Meal {
  label: string;
  time: string;
  foods: FoodItem[];
}

const MOCK_DIET: Meal[] = [
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

const Diet = () => {
  const [expandedMeal, setExpandedMeal] = useState<number | null>(0);

  const totalMacros = MOCK_DIET.reduce(
    (acc, meal) => {
      meal.foods.forEach((f) => {
        acc.protein += f.protein;
        acc.carbs += f.carbs;
        acc.fat += f.fat;
        acc.calories += f.calories;
      });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Dieta</h1>

        {/* Macros Overview */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3">Resumo do dia</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{totalMacros.calories}</p>
              <p className="text-xs text-muted-foreground">Kcal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-info">{totalMacros.protein}g</p>
              <p className="text-xs text-muted-foreground">Prot</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warning">{totalMacros.carbs}g</p>
              <p className="text-xs text-muted-foreground">Carb</p>
            </div>
            <div>
              <p className="text-lg font-bold text-destructive">{totalMacros.fat}g</p>
              <p className="text-xs text-muted-foreground">Gord</p>
            </div>
          </div>
        </Card>

        {/* Meals */}
        {MOCK_DIET.map((meal, idx) => (
          <Card key={idx} className="overflow-hidden">
            <button
              className="w-full p-4 flex items-center justify-between text-left"
              onClick={() => setExpandedMeal(expandedMeal === idx ? null : idx)}
            >
              <div>
                <h3 className="font-heading font-semibold text-foreground">{meal.label}</h3>
                <p className="text-xs text-muted-foreground">{meal.time} • {meal.foods.length} alimentos</p>
              </div>
              <Badge variant="secondary">
                {meal.foods.reduce((a, f) => a + f.calories, 0)} kcal
              </Badge>
            </button>
            {expandedMeal === idx && (
              <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                {meal.foods.map((food, fi) => (
                  <div key={fi} className="flex items-center justify-between py-1.5">
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{food.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{food.calories} kcal</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ArrowLeftRight size={14} className="text-primary" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default Diet;
