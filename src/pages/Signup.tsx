import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";
import logo from "@/assets/logo.png";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha fraca", description: "Mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (!acceptedTerms) {
      toast({
        title: "Aceite necessário",
        description: "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(email, password, name);
    if (signUpError) {
      setLoading(false);
      toast({ title: "Erro ao cadastrar", description: signUpError.message, variant: "destructive" });
      return;
    }

    // Auto login após criação da conta
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setLoading(false);
      toast({
        title: "Conta criada!",
        description: "Faça login para continuar.",
      });
      navigate("/login");
      return;
    }

    // Persiste aceite dos termos no perfil
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (uid) {
        await supabase
          .from("profiles")
          .update({
            terms_version: CURRENT_TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
          })
          .eq("user_id", uid);
      }
    } catch {
      // silencioso — será solicitado novamente se necessário
    }

    setLoading(false);
    toast({ title: "Bem-vindo!", description: "Conta criada com sucesso." });
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Hypertrophy" className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-heading font-bold text-foreground">Criar Conta</h1>
          <p className="text-muted-foreground mt-1">Comece sua transformação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Use letras maiúsculas, minúsculas e números. Evite senhas comuns.
            </p>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(v) => setAcceptedTerms(v === true)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
              Li e aceito os{" "}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Termos de Uso e a Política de Privacidade
              </Link>
              .
            </Label>
          </div>

          <Button type="submit" className="w-full glow" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
