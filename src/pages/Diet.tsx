import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight } from "lucide-react";
import { useActiveProtocol } from "@/hooks/useProtocol";

const Diet = () => {
  const { data: protocol, isLoading } = useActiveProtocol();
  const [expandedMeal, setExpandedMeal] = useState<number | null>(0);

  const diet = protocol?.diet as any;
  const meals = diet?.meals || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!diet) {
    return (
      <AppLayout>
        <div className="p-4 max-w-lg mx-auto text-center pt-20">
          <p className="text-muted-foreground">Nenhuma dieta disponível. Complete o onboarding primeiro.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Dieta</h1>

        <Card className="p-4 card-gradient border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3">Resumo do dia</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><p className="text-lg font-bold text-primary">{diet.totalCalories}</p><p className="text-xs text-muted-foreground">Kcal</p></div>
            <div><p className="text-lg font-bold text-info">{diet.protein}g</p><p className="text-xs text-muted-foreground">Prot</p></div>
            <div><p className="text-lg font-bold text-warning">{diet.carbs}g</p><p className="text-xs text-muted-foreground">Carb</p></div>
            <div><p className="text-lg font-bold text-destructive">{diet.fat}g</p><p className="text-xs text-muted-foreground">Gord</p></div>
          </div>
        </Card>

        {meals.map((meal: any, idx: number) => (
          <Card key={idx} className="overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between text-left" onClick={() => setExpandedMeal(expandedMeal === idx ? null : idx)}>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{meal.label}</h3>
                <p className="text-xs text-muted-foreground">{meal.time} • {meal.foods.length} alimentos</p>
              </div>
              <Badge variant="secondary">{meal.foods.reduce((a: number, f: any) => a + f.calories, 0)} kcal</Badge>
            </button>
            {expandedMeal === idx && (
              <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                {meal.foods.map((food: any, fi: number) => (
                  <div key={fi} className="flex items-center justify-between py-1.5">
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{food.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{food.calories} kcal</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowLeftRight size={14} className="text-primary" /></Button>
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
