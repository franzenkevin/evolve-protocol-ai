import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const CURRENT_BUILD = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";

type CheckStatus = "pending" | "ok" | "fail";
interface CheckResult {
  label: string;
  status: CheckStatus;
  detail?: string;
}

const StatusIcon = ({ status }: { status: CheckStatus }) => {
  if (status === "pending") return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />;
  if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-primary" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
};

// Mesma normalização usada em ExerciseVideo
function normName(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Diagnostics() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [version, setVersion] = useState<{ buildId?: string; hash?: string } | null>(null);

  async function runChecks() {
    setRunning(true);
    const results: CheckResult[] = [];

    // 1. /version.json
    try {
      const r = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setVersion(data);
      const synced = data.buildId === CURRENT_BUILD;
      results.push({
        label: "Endpoint /version.json",
        status: data.buildId ? "ok" : "fail",
        detail: data.buildId
          ? `buildId remoto: ${data.buildId}${data.hash ? ` (hash ${data.hash})` : ""}`
          : "Resposta sem buildId",
      });
      results.push({
        label: "Build do navegador sincronizada",
        status: synced ? "ok" : "fail",
        detail: synced
          ? "Cliente está rodando o build mais recente."
          : `Cliente: ${CURRENT_BUILD} | Servidor: ${data.buildId}. Recarregue a página.`,
      });
    } catch (e: any) {
      results.push({ label: "Endpoint /version.json", status: "fail", detail: e?.message || "Falhou" });
      results.push({ label: "Build do navegador sincronizada", status: "fail", detail: "Não foi possível comparar." });
    }
    setChecks([...results]);

    // 2. Biblioteca de exercícios
    let videoMap: Record<string, string> = {};
    try {
      const { data, error } = await supabase.from("exercises").select("name, video_url");
      if (error) throw error;
      const total = data?.length || 0;
      const withVideo = (data || []).filter((e: any) => e?.video_url).length;
      (data || []).forEach((e: any) => {
        if (e?.name && e?.video_url) videoMap[normName(e.name)] = String(e.video_url);
      });
      results.push({
        label: "Biblioteca de exercícios",
        status: total > 0 ? "ok" : "fail",
        detail: `${total} exercícios cadastrados • ${withVideo} com vídeo configurado`,
      });
    } catch (e: any) {
      results.push({ label: "Biblioteca de exercícios", status: "fail", detail: e?.message || "Falhou" });
    }
    setChecks([...results]);

    // 3. Lookup tolerante (testa amostras conhecidas)
    const samples = ["Cadeira extensora", "Mesa flexora", "Supino reto com barra"];
    const matched = samples.filter((s) => videoMap[normName(s)]).length;
    results.push({
      label: "Lookup tolerante de vídeos",
      status: matched > 0 ? "ok" : "fail",
      detail: `${matched}/${samples.length} amostras encontradas (${samples.join(", ")})`,
    });
    setChecks([...results]);

    // 4. Storage de vídeos acessível
    try {
      const { data, error } = await supabase.storage.from("exercise-videos").list("", { limit: 1 });
      if (error) throw error;
      results.push({
        label: "Storage exercise-videos",
        status: "ok",
        detail: `Bucket acessível (${data?.length ?? 0} item(s) na raiz)`,
      });
    } catch (e: any) {
      results.push({ label: "Storage exercise-videos", status: "fail", detail: e?.message || "Falhou" });
    }

    setChecks([...results]);
    setRunning(false);
  }

  useEffect(() => {
    runChecks();
  }, []);

  const allOk = checks.length > 0 && checks.every((c) => c.status === "ok");
  const anyFail = checks.some((c) => c.status === "fail");

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Diagnóstico do sistema</h1>
            <p className="text-sm text-muted-foreground">
              Build atual: <span className="font-mono">{CURRENT_BUILD}</span>
              {version?.hash ? <> • hash <span className="font-mono">{version.hash}</span></> : null}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={runChecks} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
            Reexecutar
          </Button>
        </header>

        <Card
          className={`p-4 border-l-4 ${
            allOk ? "border-l-primary" : anyFail ? "border-l-destructive" : "border-l-muted"
          }`}
        >
          <p className="text-sm font-semibold">
            {running
              ? "Executando verificações…"
              : allOk
              ? "Tudo funcionando 100%"
              : anyFail
              ? "Foram detectados problemas — veja abaixo."
              : "Aguardando resultados…"}
          </p>
        </Card>

        <div className="space-y-2">
          {checks.map((c, i) => (
            <Card key={i} className="p-4 flex items-start gap-3">
              <div className="mt-0.5">
                <StatusIcon status={c.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                {c.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 break-words">{c.detail}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
