import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, TrendingUp, Scale, Upload, Loader2 } from "lucide-react";
import { useCheckins, useCreateCheckin, uploadPhoto } from "@/hooks/useCheckins";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Progress = () => {
  const { user } = useAuth();
  const { data: checkins = [], isLoading } = useCheckins();
  const { data: protocol } = useActiveProtocol();
  const createCheckin = useCreateCheckin();
  const { toast } = useToast();

  const [weight, setWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [photos, setPhotos] = useState<{ front?: File; side?: File; back?: File }>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [checkinAdherence, setCheckinAdherence] = useState<number | null>(null);
  const [savingCheckin, setSavingCheckin] = useState(false);

  const weightHistory = checkins
    .filter((c) => c.weight)
    .slice(0, 10)
    .reverse();

  const handleSaveWeight = async () => {
    if (!weight) return;
    setSavingWeight(true);
    try {
      await createCheckin.mutateAsync({ weight: parseFloat(weight), protocol_id: protocol?.id });
      toast({ title: "Peso registrado!" });
      setWeight("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingWeight(false);
    }
  };

  const handlePhotoChange = (angle: "front" | "side" | "back", file: File | undefined) => {
    if (file) setPhotos((prev) => ({ ...prev, [angle]: file }));
  };

  const handleUploadPhotos = async () => {
    if (!user || !Object.keys(photos).length) return;
    setUploadingPhotos(true);
    try {
      const urls: Record<string, string> = {};
      for (const [angle, file] of Object.entries(photos)) {
        if (file) urls[`photo_${angle}`] = await uploadPhoto(user.id, file, angle);
      }
      await createCheckin.mutateAsync({
        photo_front: urls.photo_front || null,
        photo_side: urls.photo_side || null,
        photo_back: urls.photo_back || null,
        protocol_id: protocol?.id,
      });
      toast({ title: "Fotos enviadas!" });
      setPhotos({});
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleCheckin = async () => {
    if (checkinAdherence === null) return;
    setSavingCheckin(true);
    try {
      await createCheckin.mutateAsync({ adherence: checkinAdherence, protocol_id: protocol?.id });
      toast({ title: "Check-in enviado!" });
      setCheckinAdherence(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingCheckin(false);
    }
  };

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
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">Registrar peso</h3>
              <div className="flex gap-2">
                <Input type="number" placeholder="80.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="flex-1" />
                <Button onClick={handleSaveWeight} disabled={savingWeight}>
                  {savingWeight ? <Loader2 className="animate-spin" size={16} /> : "Salvar"}
                </Button>
              </div>
            </Card>

            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">Evolução</h3>
              {weightHistory.length > 0 ? (
                <>
                  <div className="flex items-end gap-1 h-32">
                    {weightHistory.map((w, i) => {
                      const min = Math.min(...weightHistory.map((h) => h.weight!));
                      const max = Math.max(...weightHistory.map((h) => h.weight!));
                      const range = max - min || 1;
                      const pct = ((w.weight! - min) / range) * 80 + 20;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t bg-primary/60 transition-all hover:bg-primary" style={{ height: `${pct}%` }} />
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(w.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Início: {weightHistory[0]?.weight}kg</span>
                    <span className="text-primary font-medium">
                      Atual: {weightHistory[weightHistory.length - 1]?.weight}kg
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum peso registrado ainda.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4 mt-4">
            <Card className="p-6 card-gradient border-border text-center">
              <Camera size={40} className="mx-auto text-muted-foreground mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-1">Enviar fotos</h3>
              <p className="text-sm text-muted-foreground mb-4">Frente, lado e costas</p>
              <div className="grid grid-cols-3 gap-3">
                {(["front", "side", "back"] as const).map((angle) => (
                  <label key={angle} className="cursor-pointer">
                    <div className={`aspect-[3/4] rounded-lg border-2 border-dashed ${photos[angle] ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"} flex flex-col items-center justify-center gap-2 transition-colors`}>
                      <Upload size={20} className={photos[angle] ? "text-primary" : "text-muted-foreground"} />
                      <span className="text-xs text-muted-foreground">
                        {angle === "front" ? "Frente" : angle === "side" ? "Lado" : "Costas"}
                      </span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(angle, e.target.files?.[0])} />
                  </label>
                ))}
              </div>
              {Object.keys(photos).length > 0 && (
                <Button className="mt-4 glow w-full" onClick={handleUploadPhotos} disabled={uploadingPhotos}>
                  {uploadingPhotos ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Enviar fotos
                </Button>
              )}
            </Card>

            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Histórico de fotos</h3>
              {checkins.filter((c) => c.photo_front || c.photo_side || c.photo_back).length > 0 ? (
                <div className="space-y-2">
                  {checkins.filter((c) => c.photo_front || c.photo_side || c.photo_back).map((c) => (
                    <div key={c.id} className="text-sm text-muted-foreground">
                      📸 {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma foto enviada ainda.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4 mt-4">
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-3">Check-in semanal</h3>
              <div className="space-y-3">
                <div>
                  <Label>Como está sua aderência geral?</Label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { emoji: "😴", value: 25 },
                      { emoji: "😐", value: 50 },
                      { emoji: "💪", value: 75 },
                      { emoji: "🔥", value: 100 },
                    ].map(({ emoji, value }) => (
                      <Button
                        key={value}
                        variant={checkinAdherence === value ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-lg"
                        onClick={() => setCheckinAdherence(value)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full mt-2 glow" onClick={handleCheckin} disabled={savingCheckin || checkinAdherence === null}>
                  {savingCheckin ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Enviar check-in
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Progress;
