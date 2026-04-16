import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import logo from "@/assets/logo.png";

const AcceptTerms = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isUpdate = !!profile?.terms_version && profile.terms_version !== CURRENT_TERMS_VERSION;

  const handleAccept = async () => {
    if (!accepted || !user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        terms_version: CURRENT_TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao registrar aceite", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aceite registrado", description: "Obrigado por revisar os termos atualizados." });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Hypertrophy" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-heading font-bold text-foreground text-center">
            {isUpdate ? "Termos atualizados" : "Aceite dos Termos"}
          </h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            {isUpdate
              ? "Atualizamos nossos Termos de Uso e Política de Privacidade. Para continuar usando o Hypertrophy, revise e aceite a nova versão."
              : "Para continuar, precisamos do seu aceite aos Termos de Uso e à Política de Privacidade."}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 mb-4">
          <p className="text-sm text-muted-foreground">
            Versão atual:{" "}
            <span className="text-foreground font-mono">{CURRENT_TERMS_VERSION}</span>
          </p>
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-block mt-2"
          >
            Ler Termos de Uso e Política de Privacidade →
          </Link>
        </div>

        <div className="flex items-start gap-2 mb-6">
          <Checkbox
            id="accept-terms"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-1"
          />
          <Label htmlFor="accept-terms" className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
            Li e aceito os Termos de Uso e a Política de Privacidade na versão {CURRENT_TERMS_VERSION}.
          </Label>
        </div>

        <Button onClick={handleAccept} disabled={!accepted || loading} className="w-full glow">
          {loading ? "Registrando..." : "Aceitar e continuar"}
        </Button>
      </div>
    </div>
  );
};

export default AcceptTerms;
