import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, TrendingUp, Scale, Upload } from "lucide-react";

const Progress = () => {
  const [weight, setWeight] = useState("");

  const weightHistory = [
    { date: "01/03", value: 82 },
    { date: "08/03", value: 81.5 },
    { date: "15/03", value: 81.2 },
    { date: "22/03", value: 80.8 },
    { date: "29/03", value: 80.5 },
    { date: "05/04", value: 80.1 },
  ];

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Progresso</h1>

        <Tabs defaultValue="weight">
          <TabsList className="w-full">
            <TabsTrigger value="weight" className="flex-1 gap-1"><Scale size={14} />Peso</TabsTrigger>
            <TabsTrigger value="photos" className="flex-1 gap-1"><Camera size={14} />Fotos</TabsTrigger>
            <TabsTrigger value="checkin" className="flex-1 gap-1"><TrendingUp size={14} />Check-in</TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="space-y-4 mt-4">
            {/* Log Weight */}
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">Registrar peso</h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="80.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1"
                />
                <Button>Salvar</Button>
              </div>
            </Card>

            {/* Weight Chart Placeholder */}
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">Evolução</h3>
              <div className="flex items-end gap-1 h-32">
                {weightHistory.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/60 transition-all hover:bg-primary"
                      style={{ height: `${((w.value - 78) / 5) * 100}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">{w.date}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Início: 82kg</span>
                <span className="text-primary font-medium">Atual: 80.1kg (-1.9kg)</span>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 mt-4">
            <Card className="p-6 card-gradient border-border text-center">
              <Camera size={40} className="mx-auto text-muted-foreground mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-1">Enviar fotos</h3>
              <p className="text-sm text-muted-foreground mb-4">Frente, lado e costas</p>
              <div className="grid grid-cols-3 gap-3">
                {["Frente", "Lado", "Costas"].map((angle) => (
                  <label key={angle} className="cursor-pointer">
                    <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors">
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{angle}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Histórico de fotos</h3>
              <p className="text-sm text-muted-foreground">Nenhuma foto enviada ainda.</p>
            </Card>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4 mt-4">
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">Check-in semanal</h3>
              <div className="space-y-3">
                <div>
                  <Label>Como está sua aderência ao treino?</Label>
                  <div className="flex gap-2 mt-1">
                    {["😴", "😐", "💪", "🔥"].map((emoji, i) => (
                      <Button key={i} variant="outline" size="sm" className="flex-1 text-lg">{emoji}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Como está sua aderência à dieta?</Label>
                  <div className="flex gap-2 mt-1">
                    {["😴", "😐", "💪", "🔥"].map((emoji, i) => (
                      <Button key={i} variant="outline" size="sm" className="flex-1 text-lg">{emoji}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Qualidade do sono</Label>
                  <div className="flex gap-2 mt-1">
                    {["😴", "😐", "😊", "🌟"].map((emoji, i) => (
                      <Button key={i} variant="outline" size="sm" className="flex-1 text-lg">{emoji}</Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full mt-2 glow">Enviar check-in</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Progress;
