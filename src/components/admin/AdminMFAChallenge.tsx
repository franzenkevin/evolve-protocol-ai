import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  onVerified: () => void;
}

const AdminMFAChallenge = ({ onVerified }: Props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const verified = data?.all?.find((f) => f.factor_type === "totp" && f.status === "verified");
      if (verified) setFactorId(verified.id);
      setLoading(false);
    };
    load();
  }, [toast]);

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;
    setVerifying(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: ch.id,
        code,
      });
      if (vErr) throw vErr;
      onVerified();
    } catch (e: any) {
      toast({ title: "Código inválido", description: e.message, variant: "destructive" });
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-4 card-gradient border-border">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={20} />
          <h1 className="font-heading font-bold text-lg text-foreground">Verificação 2FA</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Digite o código de 6 dígitos do seu app autenticador para acessar o painel.
        </p>

        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          className="text-center text-lg font-mono tracking-widest"
        />

        <Button onClick={handleVerify} disabled={code.length !== 6 || verifying} className="w-full">
          {verifying ? "Verificando..." : "Verificar"}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full gap-2 text-muted-foreground">
          <LogOut size={14} /> Sair
        </Button>
      </Card>
    </div>
  );
};

export default AdminMFAChallenge;
