import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Utensils,
  Zap,
  Info,
  Leaf,
  RefreshCw,
} from "lucide-react";
import { useActiveProtocol } from "@/hooks/useProtocol";
import DietFeedbackCard from "@/components/DietFeedbackCard";
import RecipeCalculator from "@/components/RecipeCalculator";
import { Calculator } from "lucide-react";
import { normalizeSubstitutions } from "@/lib/dietNormalize";

const Diet = () => {
  const { data: protocol, isLoading } = useActiveProtocol();
  const [expandedMeal, setExpandedMeal] = useState<number | null>(0);
  const [activeOption, setActiveOption] = useState<Record<number, number>>({});
  const [showSubs, setShowSubs] = useState<number | null>(null);

  const diet = protocol?.diet as any;
  const meals = diet?.meals || [];

  const getOption = (idx: number) => activeOption[idx] || 0;

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
          <p className="text-muted-foreground">
            Nenhuma dieta disponível. Complete o onboarding primeiro.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Dieta</h1>

        {/* Macros summary */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3">Resumo do dia</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{diet.totalCalories}</p>
              <p className="text-xs text-muted-foreground">Kcal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-info">{diet.protein}g</p>
              <p className="text-xs text-muted-foreground">Prot</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warning">{diet.carbs}g</p>
              <p className="text-xs text-muted-foreground">Carb</p>
            </div>
            <div>
              <p className="text-lg font-bold text-destructive">{diet.fat}g</p>
              <p className="text-xs text-muted-foreground">Gord</p>
            </div>
          </div>
        </Card>

        {/* Carb front loading note */}
        {diet.carbFrontLoading && (
          <Card className="p-3 border-border bg-muted/30">
            <div className="flex items-start gap-2">
              <Zap size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{diet.carbFrontLoading}</p>
            </div>
          </Card>
        )}

        {/* Meals */}
        {meals.map((meal: any, idx: number) => {
          const isExpanded = expandedMeal === idx;
          const optionIdx = getOption(idx);
          const options = meal.options || [];
          const currentOption = options[optionIdx] || options[0];
          const totalCal = currentOption?.foods?.reduce(
            (a: number, f: any) => a + (f.calories || 0),
            0
          ) || 0;

          return (
            <Card key={idx} className="overflow-hidden">
              {/* Meal header */}
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setExpandedMeal(isExpanded ? null : idx)}
              >
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{meal.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {meal.time} • {currentOption?.foods?.length || 0} alimentos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{totalCal} kcal</Badge>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {/* Option selector */}
                  {options.length > 1 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {options.map((opt: any, oi: number) => (
                        <Button
                          key={oi}
                          variant={optionIdx === oi ? "default" : "outline"}
                          size="sm"
                          className="gap-1.5 text-[10px] h-7 px-2"
                          onClick={() => setActiveOption((p) => ({ ...p, [idx]: oi }))}
                        >
                          {oi === 0 ? <Leaf size={10} /> : <Utensils size={10} />}
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Food list */}
                  {currentOption?.foods?.map((food: any, fi: number) => (
                    <div key={fi} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">{food.name}</p>
                        <p className="text-xs text-primary/80 font-mono">{food.amount}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          {food.calories} kcal
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          P:{food.protein}g C:{food.carbs}g G:{food.fat}g
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Substitutions toggle */}
                  {meal.substitutions && meal.substitutions.length > 0 && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs text-primary w-full"
                        onClick={() => setShowSubs(showSubs === idx ? null : idx)}
                      >
                        <ArrowLeftRight size={12} />
                        {showSubs === idx ? "Ocultar substituições" : "Ver substituições"}
                      </Button>

                      {showSubs === idx && (
                        <div className="mt-2 space-y-3">
                          {normalizeSubstitutions(meal.substitutions).map((sub, si) => {
                            const ref = sub.referenceFood;
                            const wasLegacy = (meal.substitutions[si]?.options?.length ?? 0) > 0
                              && typeof meal.substitutions[si].options[0] === "string";

                            return (
                              <div key={si} className="bg-muted/30 rounded-md p-2.5 space-y-2">
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    {sub.category}
                                    {wasLegacy && (
                                      <span className="ml-1.5 text-[9px] text-muted-foreground/70 normal-case font-normal">
                                        (porções estimadas)
                                      </span>
                                    )}
                                  </p>
                                  {ref && (
                                    <p className="text-[10px] text-primary/80 mt-0.5">
                                      Referência: <span className="font-medium text-foreground">{ref.name}</span> · {ref.amount} · {ref.calories} kcal · P{ref.protein}g C{ref.carbs}g G{ref.fat}g
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  {sub.options.map((opt, oi) => (
                                    <div
                                      key={oi}
                                      className="flex items-center justify-between gap-2 py-1 border-b border-border/30 last:border-0"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-foreground font-medium truncate">{opt.name}</p>
                                        <p className="text-[10px] text-primary/80 font-mono">{opt.amount}</p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[10px] text-muted-foreground block">
                                          {opt.calories} kcal
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          P{opt.protein}g C{opt.carbs}g G{opt.fat}g
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {/* Daily diet feedback */}
        <DietFeedbackCard />

        {/* Supplement notes */}
        {Array.isArray(diet.notes) && diet.notes.length > 0 && (
          <Card className="p-4 border-border">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-primary" />
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Suplementação
              </h3>
            </div>
            <div className="space-y-1">
              {diet.notes.map((note: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground">
                  • {note}
                </p>
              ))}
            </div>
          </Card>
        )}

        {/* Recipe calculator */}
        <Card className="p-4 border-border">
          <div className="flex items-center gap-2 mb-2">
            <Calculator size={14} className="text-primary" />
            <h3 className="font-heading font-semibold text-sm text-foreground">
              Calculadora de receita
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Some macros e kcal de vários alimentos para montar uma receita fit ou testar uma da internet.
          </p>
          <RecipeCalculator />
        </Card>
      </div>
    </AppLayout>
  );
};

export default Diet;
