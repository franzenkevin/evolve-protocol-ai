import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const CreatePassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      // Token can come from URL fragment (#access_token=...) or query (?token_hash=...)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const tokenHash = searchParams.get("token_hash") || searchParams.get("token");
      const type = searchParams.get("type") || hashParams.get("type");

      try {
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setUserEmail(data.user?.email || null);
        } else if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as any) || "magiclink",
          });
          if (error) throw error;
          setUserEmail(data.user?.email || null);
        } else {
          // Maybe user already logged in
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            setUserEmail(data.user.email || null);
          } else {
            toast.error("Link inválido ou expirado. Solicite novamente.");
            setTimeout(() => navigate("/login"), 2000);
          }
        }
      } catch (e: any) {
        console.error("verify token error", e);
        toast.error(e.message || "Link inválido ou expirado");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha criada com sucesso!");
      navigate("/welcome", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar senha");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="EVORIA" className="w-16 h-16 mb-4" />
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
            <CheckCircle2 size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Pagamento confirmado!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Crie sua senha para acessar seu protocolo personalizado
          </p>
          {userEmail && (
            <p className="text-xs text-primary mt-2 font-medium">{userEmail}</p>
          )}
        </div>

        <Card className="p-6 card-gradient border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full glow h-12"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar senha e acessar"
              )}
            </Button>
          </form>
        </Card>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Suas informações estão protegidas e criptografadas
        </p>
      </div>
    </div>
  );
};

export default CreatePassword;
