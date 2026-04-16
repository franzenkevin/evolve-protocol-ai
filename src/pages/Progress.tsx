import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import ProtocolProgressWidget from "@/components/ProtocolProgressWidget";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, TrendingUp, Scale, Upload, Loader2, BarChart3, Flame, Trophy, Dumbbell as DumbbellIcon, Star, Lock, Clock } from "lucide-react";
import { useCheckins, useCreateCheckin, uploadPhoto } from "@/hooks/useCheckins";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useAllWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useBodyAssessments } from "@/hooks/useBodyAssessments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Progress = () => {
  const { user } = useAuth();
  const { data: checkins = [] } = useCheckins();
  const { data: protocol } = useActiveProtocol();
  const { data: allLogs = [] } = useAllWorkoutLogs();
  const { data: assessments = [] } = useBodyAssessments();
  const createCheckin = useCreateCheckin();
  const { toast } = useToast();

  const [weight, setWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [photos, setPhotos] = useState<{ front?: File; side?: File; back?: File }>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [checkinRating, setCheckinRating] = useState(0);
  const [checkinNotes, setCheckinNotes] = useState("");
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [assessmentPhotoUrls, setAssessmentPhotoUrls] = useState<{ front?: string; side?: string; back?: string } | null>(null);

  const weightHistory = checkins.filter((c) => c.weight).slice(0, 10).reverse();
  const photoCheckins = checkins.filter((c) => c.photo_front || c.photo_side || c.photo_back);
  // Oldest -> newest
  const photoCheckinsAsc = [...photoCheckins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Latest assessment (used as fallback for Day 0 photos)
  const latestAssessment = assessments[0] as any | undefined;

  // Resolve assessment photos to public-ish URLs (signed)
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!latestAssessment?.photo_paths?.length) {
        setAssessmentPhotoUrls(null);
        return;
      }
      const paths: string[] = latestAssessment.photo_paths;
      // photo_paths from onboarding follow pattern <user>/assessment/{front|back|left|right}.<ext>
      const pickByAngle = (angle: string) =>
        paths.find((p) => p.toLowerCase().includes(`/${angle}.`)) ||
        paths.find((p) => p.toLowerCase().includes(angle));
      const targets = {
        front: pickByAngle("front"),
        side: pickByAngle("right") || pickByAngle("left") || pickByAngle("side"),
        back: pickByAngle("back"),
      };
      const out: { front?: string; side?: string; back?: string } = {};
      for (const [k, p] of Object.entries(targets)) {
        if (!p) continue;
        const { data } = await supabase.storage
          .from("photos")
          .createSignedUrl(p, 60 * 60 * 24 * 7);
        if (data?.signedUrl) (out as any)[k] = data.signedUrl;
      }
      if (!cancelled) setAssessmentPhotoUrls(out);
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [latestAssessment?.id]);

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

  // Day 0: prefer assessment photos (from onboarding), fallback to first checkin photos
  const assessmentDay0 = assessmentPhotoUrls && (assessmentPhotoUrls.front || assessmentPhotoUrls.side || assessmentPhotoUrls.back)
    ? {
        photo_front: assessmentPhotoUrls.front || null,
        photo_side: assessmentPhotoUrls.side || null,
        photo_back: assessmentPhotoUrls.back || null,
        created_at: latestAssessment?.created_at || protocol?.start_date || new Date().toISOString(),
        source: "assessment" as const,
      }
    : null;
  const photoDay0: any = assessmentDay0 || photoCheckinsAsc[0] || null;
  const photoDay30 = daysSinceStart >= 30 ? findPhotoInWindow(day30Date) : null;
  const photoDay60 = daysSinceStart >= 60 ? findPhotoInWindow(day60Date) : null;
  const day30Unlocked = daysSinceStart >= 30;
  const day60Unlocked = daysSinceStart >= 60;
  const daysUntilDay30 = Math.max(0, 30 - daysSinceStart);
  const daysUntilDay60 = Math.max(0, 60 - daysSinceStart);

  // Last weekly check-in (only entries with rating in notes/adherence — we mark check-ins by adherence presence and absence of weight/photos)
  const lastCheckin = useMemo(() => {
    return checkins.find((c) => c.adherence != null && !c.weight && !c.photo_front && !c.photo_side && !c.photo_back) || null;
  }, [checkins]);
  const daysSinceLastCheckin = lastCheckin
    ? Math.floor((Date.now() - new Date(lastCheckin.created_at).getTime()) / 86400000)
    : null;
  const checkinUnlocked = daysSinceLastCheckin === null || daysSinceLastCheckin >= 7;
  const daysUntilCheckin = checkinUnlocked ? 0 : Math.max(0, 7 - (daysSinceLastCheckin || 0));

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
    if (!checkinUnlocked) return;
    if (checkinRating === 0) {
      toast({ title: "Escolha de 1 a 5 estrelas", variant: "destructive" });
      return;
    }
    setSavingCheckin(true);
    try {
      // Map 1-5 stars to 20-100 adherence score for stats compatibility
      const adherenceScore = checkinRating * 20;
      await createCheckin.mutateAsync({
        adherence: adherenceScore,
        notes: checkinNotes || null,
        protocol_id: protocol?.id,
      });
      toast({ title: "Check-in enviado!" });
      setCheckinRating(0);
      setCheckinNotes("");
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
            {/* Explanation card */}
            <Card className="p-4 card-gradient border-primary/20">
              <div className="flex items-start gap-2">
                <Camera size={16} className="text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Como funcionam as fotos do protocolo</p>
                  <p>📸 <span className="text-foreground font-medium">Início (dia 0)</span>: tire suas primeiras fotos nos 3 ângulos (frente, lado, costas) ao começar o protocolo.</p>
                  <p>🔓 <span className="text-foreground font-medium">Dia 30</span>: nova janela libera para refazer as fotos nos mesmos ângulos e comparar a evolução de meio de ciclo.</p>
                  <p>🏁 <span className="text-foreground font-medium">Dia 60</span>: última janela libera ao fim do protocolo — fotos finais usadas na troca para o próximo treino.</p>
                </div>
              </div>
            </Card>

            {/* Active upload window */}
            {(() => {
              const needsDay0 = !photoDay0;
              const needsDay30 = day30Unlocked && !photoDay30;
              const needsDay60 = day60Unlocked && !photoDay60;
              const activeLabel = needsDay0
                ? "Fotos iniciais (Dia 0)"
                : needsDay60
                ? "Fotos finais (Dia 60)"
                : needsDay30
                ? "Fotos de meio de ciclo (Dia 30)"
                : null;

              if (!activeLabel) {
                return (
                  <Card className="p-4 card-gradient border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      ✅ Fotos da janela atual já enviadas. A próxima janela abre em{" "}
                      <span className="text-primary font-semibold">
                        {!day30Unlocked
                          ? `${daysUntilDay30} dia(s) (Dia 30)`
                          : !day60Unlocked
                          ? `${daysUntilDay60} dia(s) (Dia 60)`
                          : "—"}
                      </span>.
                    </p>
                  </Card>
                );
              }

              return (
                <Card className="p-6 card-gradient border-border text-center">
                  <Camera size={32} className="mx-auto text-primary mb-2" />
                  <h3 className="font-heading font-semibold text-foreground mb-1 text-sm">{activeLabel}</h3>
                  <p className="text-xs text-muted-foreground mb-4">Frente, lado e costas</p>
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
              );
            })()}

            {/* Locked windows */}
            {protocol && (!day30Unlocked || !day60Unlocked) && (
              <div className="grid grid-cols-2 gap-2">
                {!day30Unlocked && (
                  <Card className="p-3 border-border bg-muted/20 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">🔒 Dia 30</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{daysUntilDay30}d</p>
                    <p className="text-[10px] text-muted-foreground">para abrir</p>
                  </Card>
                )}
                {!day60Unlocked && (
                  <Card className="p-3 border-border bg-muted/20 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">🔒 Dia 60</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{daysUntilDay60}d</p>
                    <p className="text-[10px] text-muted-foreground">para abrir</p>
                  </Card>
                )}
              </div>
            )}

            {/* 3-window comparison */}
            {photoDay0 && (
              <Card className="p-4 card-gradient border-border">
                <h3 className="font-heading font-semibold text-foreground mb-3 text-sm">Comparativo do protocolo</h3>
                {(["front", "side", "back"] as const).map((angle) => {
                  const key = `photo_${angle}` as const;
                  const p0 = (photoDay0 as any)?.[key];
                  const p30 = (photoDay30 as any)?.[key];
                  const p60 = (photoDay60 as any)?.[key];
                  if (!p0 && !p30 && !p60) return null;
                  const angleLabel = angle === "front" ? "Frente" : angle === "side" ? "Lado" : "Costas";
                  const Slot = ({ src, label, locked, date }: { src?: string; label: string; locked?: boolean; date?: string }) => (
                    <div>
                      {src ? (
                        <img src={src} alt={label} className="w-full aspect-[3/4] object-cover rounded-md border border-border" />
                      ) : (
                        <div className="w-full aspect-[3/4] rounded-md bg-secondary/40 border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
                          {locked ? "🔒" : "—"}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1 text-center">{label}</p>
                      {date && <p className="text-[9px] text-muted-foreground text-center">{date}</p>}
                    </div>
                  );
                  return (
                    <div key={angle} className="mb-3 last:mb-0">
                      <p className="text-xs text-muted-foreground mb-1">{angleLabel}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Slot src={p0} label="Dia 0" date={photoDay0 ? new Date(photoDay0.created_at).toLocaleDateString("pt-BR") : undefined} />
                        <Slot src={p30} label="Dia 30" locked={!day30Unlocked} date={photoDay30 ? new Date(photoDay30.created_at).toLocaleDateString("pt-BR") : undefined} />
                        <Slot src={p60} label="Dia 60" locked={!day60Unlocked} date={photoDay60 ? new Date(photoDay60.created_at).toLocaleDateString("pt-BR") : undefined} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
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
