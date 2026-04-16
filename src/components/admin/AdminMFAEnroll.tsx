import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Smartphone, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  onEnrolled: () => void;
}

const AdminMFAEnroll = ({ onEnrolled }: Props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [enrolling, setEnrolling] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const enroll = async () => {
      // Limpa fatores não verificados antigos para evitar erro "factor already exists"
      const { data: list } = await supabase.auth.mfa.listFactors();
      const unverified = list?.all?.filter((f) => f.status !== "verified") ?? [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) {
        toast({ title: "Erro ao iniciar MFA", description: error.message, variant: "destructive" });
        setEnrolling(false);
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(false);
    };
    enroll();
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
      toast({ title: "MFA ativado!", description: "Acesso admin liberado." });
      onEnrolled();
    } catch (e: any) {
      toast({ title: "Código inválido", description: e.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-4 card-gradient border-border">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={20} />
          <h1 className="font-heading font-bold text-lg text-foreground">Ativar 2FA do admin</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Por segurança, contas administrativas exigem autenticação em duas etapas.
          Escaneie o QR Code abaixo no <strong>Google Authenticator</strong>, <strong>Authy</strong> ou <strong>1Password</strong>.
        </p>

        {enrolling && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {qrCode && (
          <>
            <div className="flex justify-center bg-white p-4 rounded-lg">
              <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
            </div>
            {secret && (
              <div className="text-xs text-muted-foreground text-center">
                <p>Não consegue escanear? Use a chave manual:</p>
                <code className="block mt-1 bg-muted px-2 py-1 rounded font-mono text-foreground break-all">
                  {secret}
                </code>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm flex items-center gap-2 text-foreground">
                <Smartphone size={14} />
                Digite o código de 6 dígitos do app:
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || verifying}
              className="w-full"
            >
              {verifying ? "Verificando..." : "Confirmar e ativar"}
            </Button>
          </>
        )}

        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full gap-2 text-muted-foreground">
          <LogOut size={14} /> Cancelar e sair
        </Button>
      </Card>
    </div>
  );
};

export default AdminMFAEnroll;
