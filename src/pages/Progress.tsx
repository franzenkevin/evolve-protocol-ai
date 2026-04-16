import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import ProtocolProgressWidget from "@/components/ProtocolProgressWidget";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, TrendingUp, Scale, Upload, Loader2, BarChart3, Flame, Trophy, Dumbbell as DumbbellIcon } from "lucide-react";
import { useCheckins, useCreateCheckin, uploadPhoto } from "@/hooks/useCheckins";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useAllWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Progress = () => {
  const { user } = useAuth();
  const { data: checkins = [] } = useCheckins();
  const { data: protocol } = useActiveProtocol();
  const { data: allLogs = [] } = useAllWorkoutLogs();
  const createCheckin = useCreateCheckin();
  const { toast } = useToast();

  const [weight, setWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [photos, setPhotos] = useState<{ front?: File; side?: File; back?: File }>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [checkinAdherence, setCheckinAdherence] = useState<number | null>(null);
  const [savingCheckin, setSavingCheckin] = useState(false);

  const weightHistory = checkins.filter((c) => c.weight).slice(0, 10).reverse();
  const photoCheckins = checkins.filter((c) => c.photo_front || c.photo_side || c.photo_back);
  // Oldest -> newest
  const photoCheckinsAsc = [...photoCheckins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Photo windows based on protocol start date (day 0, 30, 60)
  const protocolStart = protocol?.start_date ? new Date(protocol.start_date) : null;
  const daysSinceStart = protocolStart
    ? Math.floor((Date.now() - protocolStart.getTime()) / 86400000)
    : 0;

  const offsetDate = (offset: number) => {
    if (!protocolStart) return null;
    const d = new Date(protocolStart);
    d.setDate(d.getDate() + offset);
    return d;
  };
  const day30Date = offsetDate(30);
  const day60Date = offsetDate(60);

  const findPhotoInWindow = (centerDate: Date | null, tolDays = 7) => {
    if (!centerDate) return null;
    const center = centerDate.getTime();
    const tol = tolDays * 86400000;
    return (
      photoCheckinsAsc.find((c) => {
        const t = new Date(c.created_at).getTime();
        return Math.abs(t - center) <= tol;
      }) || null
    );
  };

  const photoDay0 = photoCheckinsAsc[0] || null;
  const photoDay30 = daysSinceStart >= 30 ? findPhotoInWindow(day30Date) : null;
  const photoDay60 = daysSinceStart >= 60 ? findPhotoInWindow(day60Date) : null;
  const day30Unlocked = daysSinceStart >= 30;
  const day60Unlocked = daysSinceStart >= 60;
  const daysUntilDay30 = Math.max(0, 30 - daysSinceStart);
  const daysUntilDay60 = Math.max(0, 60 - daysSinceStart);

  // Stats: tonnage, sessions, streak, PRs
  const stats = useMemo(() => {
    const protoLogs = protocol ? allLogs.filter((l) => l.protocol_id === protocol.id) : allLogs;
    let tonnage = 0;
    let totalReps = 0;
    let totalSets = 0;
    const sessionDates = new Set<string>();
    const exerciseBest: Record<string, { name: string; weight: number; reps: number; date: string }> = {};
    const exerciseHistory: Record<string, { name: string; entries: { date: string; topWeight: number }[] }> = {};

    protoLogs.forEach((log) => {
      sessionDates.add(log.session_date);
      const sets = (log.sets as any[]) || [];
      let topWeight = 0;
      sets.forEach((s: any) => {
        if (s.completed && s.type === "valid") {
          const w = Number(s.weight) || 0;
          const r = Number(s.reps) || 0;
          tonnage += w * r;
          totalReps += r;
          totalSets += 1;
          if (w > topWeight) topWeight = w;
          // PR tracking (best 1RM-ish: heaviest top set)
          const cur = exerciseBest[log.exercise_id];
          if (!cur || w > cur.weight) {
            exerciseBest[log.exercise_id] = { name: log.exercise_name, weight: w, reps: r, date: log.session_date };
          }
        }
      });
      if (topWeight > 0) {
        if (!exerciseHistory[log.exercise_id]) {
          exerciseHistory[log.exercise_id] = { name: log.exercise_name, entries: [] };
        }
        exerciseHistory[log.exercise_id].entries.push({ date: log.session_date, topWeight });
      }
    });

    // Compute streak (consecutive days with any session, ending today or yesterday)
    const sortedDates = Array.from(sessionDates).sort().reverse();
    let streak = 0;
    if (sortedDates.length > 0) {
      const today = new Date();
      const ymd = (d: Date) => d.toISOString().split("T")[0];
      let cursor = new Date(today);
      // tolerate today not done yet (start from yesterday)
      if (sortedDates[0] !== ymd(cursor)) cursor.setDate(cursor.getDate() - 1);
      const dateSet = sessionDates;
      while (dateSet.has(ymd(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // Sessions in last 7 days (adherence vs planned trainingDays)
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const sessionsLast7 = Array.from(sessionDates).filter((d) => new Date(d).getTime() >= sevenDaysAgo).length;

    // Load progression: top 5 exercises with most data
    const evolution = Object.entries(exerciseHistory)
      .map(([id, h]) => {
        const sorted = h.entries.sort((a, b) => a.date.localeCompare(b.date));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const delta = last.topWeight - first.topWeight;
        const pct = first.topWeight > 0 ? Math.round((delta / first.topWeight) * 100) : 0;
        return { id, name: h.name, sessions: sorted.length, first: first.topWeight, last: last.topWeight, delta, pct, points: sorted };
      })
      .filter((e) => e.sessions >= 2)
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8);

    const prs = Object.entries(exerciseBest)
      .map(([id, b]) => ({ id, ...b }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6);

    const adherenceList = checkins.filter((c) => c.adherence);
    const avgAdherence = adherenceList.length
      ? Math.round(adherenceList.reduce((a, c) => a + (c.adherence || 0), 0) / adherenceList.length)
      : 0;

    return {
      tonnage,
      totalReps,
      totalSets,
      totalWorkouts: sessionDates.size,
      streak,
      sessionsLast7,
      evolution,
      prs,
      avgAdherence,
    };
  }, [allLogs, protocol, checkins]);

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

  const fmtTonnage = (kg: number) => kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)}kg`;

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Progresso</h1>

        {protocol && (
          <ProtocolProgressWidget
            startDate={protocol.start_date}
            endDate={protocol.end_date}
            totalWorkouts={stats.totalWorkouts}
            totalTonnage={stats.tonnage}
            avgAdherence={stats.avgAdherence}
          />
        )}

        <Tabs defaultValue="stats">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="stats" className="gap-1 text-xs"><BarChart3 size={12} />Stats</TabsTrigger>
            <TabsTrigger value="weight" className="gap-1 text-xs"><Scale size={12} />Peso</TabsTrigger>
            <TabsTrigger value="photos" className="gap-1 text-xs"><Camera size={12} />Fotos</TabsTrigger>
            <TabsTrigger value="checkin" className="gap-1 text-xs"><TrendingUp size={12} />Check-in</TabsTrigger>
          </TabsList>

          {/* STATS TAB */}
          <TabsContent value="stats" className="space-y-3 mt-4">
            {/* Volume highlights */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3 card-gradient border-border">
                <div className="flex items-center gap-2 mb-1">
                  <DumbbellIcon size={14} className="text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Treinos</span>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{stats.totalWorkouts}</p>
                <p className="text-[10px] text-muted-foreground">{stats.sessionsLast7} nos últimos 7 dias</p>
              </Card>
              <Card className="p-3 card-gradient border-border">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={14} className="text-info" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Volume total</span>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{fmtTonnage(stats.tonnage)}</p>
                <p className="text-[10px] text-muted-foreground">{stats.totalSets} séries • {stats.totalReps} reps</p>
              </Card>
              <Card className="p-3 card-gradient border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={14} className="text-warning" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Streak</span>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{stats.streak} {stats.streak === 1 ? "dia" : "dias"}</p>
                <p className="text-[10px] text-muted-foreground">Sequência atual</p>
              </Card>
              <Card className="p-3 card-gradient border-border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-success" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Aderência</span>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">{stats.avgAdherence}%</p>
                <p className="text-[10px] text-muted-foreground">Média check-ins</p>
              </Card>
            </div>

            {/* PRs */}
            <Card className="p-4 card-gradient border-border">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-primary" />
                <h3 className="font-heading font-semibold text-foreground text-sm">Recordes (PRs)</h3>
              </div>
              {stats.prs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Registre treinos para ver seus recordes pessoais.</p>
              ) : (
                <div className="space-y-2">
                  {stats.prs.map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between p-2 bg-secondary/40 rounded-md">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{pr.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(pr.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-bold text-primary tabular-nums">{pr.weight}kg</p>
                        <p className="text-[10px] text-muted-foreground">×{pr.reps}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Evolution per exercise */}
            <Card className="p-4 card-gradient border-border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-info" />
                <h3 className="font-heading font-semibold text-foreground text-sm">Evolução de cargas</h3>
              </div>
              {stats.evolution.length === 0 ? (
                <p className="text-xs text-muted-foreground">Registre pelo menos 2 sessões do mesmo exercício para ver a evolução.</p>
              ) : (
                <div className="space-y-3">
                  {stats.evolution.map((e) => (
                    <div key={e.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-foreground truncate flex-1 min-w-0">{e.name}</p>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {e.first}→{e.last}kg
                          </span>
                          <span className={`text-[10px] font-bold tabular-nums ${e.delta > 0 ? "text-success" : e.delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {e.delta > 0 ? "+" : ""}{e.delta}kg ({e.pct > 0 ? "+" : ""}{e.pct}%)
                          </span>
                        </div>
                      </div>
                      {/* mini sparkline */}
                      <div className="flex items-end gap-0.5 h-8 bg-secondary/30 rounded p-1">
                        {e.points.map((pt, i) => {
                          const max = Math.max(...e.points.map((p) => p.topWeight));
                          const min = Math.min(...e.points.map((p) => p.topWeight));
                          const range = max - min || 1;
                          const pct = ((pt.topWeight - min) / range) * 80 + 20;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-primary/60 rounded-sm min-w-[2px]"
                              style={{ height: `${pct}%` }}
                              title={`${pt.date}: ${pt.topWeight}kg`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

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

            {/* Antes vs Depois */}
            {firstPhotos && latestPhotos && firstPhotos.id !== latestPhotos.id && (
              <Card className="p-4 card-gradient border-border">
                <h3 className="font-heading font-semibold text-foreground mb-3 text-sm">Antes vs Depois</h3>
                {(["front", "side", "back"] as const).map((angle) => {
                  const key = `photo_${angle}` as const;
                  const before = (firstPhotos as any)[key];
                  const after = (latestPhotos as any)[key];
                  if (!before && !after) return null;
                  return (
                    <div key={angle} className="mb-3 last:mb-0">
                      <p className="text-xs text-muted-foreground mb-1 capitalize">{angle === "front" ? "Frente" : angle === "side" ? "Lado" : "Costas"}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          {before ? (
                            <img src={before} alt="Antes" className="w-full aspect-[3/4] object-cover rounded-md border border-border" />
                          ) : (
                            <div className="w-full aspect-[3/4] rounded-md bg-secondary/40 flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1 text-center">
                            {new Date(firstPhotos.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          {after ? (
                            <img src={after} alt="Depois" className="w-full aspect-[3/4] object-cover rounded-md border border-primary/40" />
                          ) : (
                            <div className="w-full aspect-[3/4] rounded-md bg-secondary/40 flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                          )}
                          <p className="text-[10px] text-primary mt-1 text-center font-medium">
                            {new Date(latestPhotos.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}

            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Histórico de fotos</h3>
              {photoCheckins.length > 0 ? (
                <div className="space-y-2">
                  {photoCheckins.map((c) => (
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
