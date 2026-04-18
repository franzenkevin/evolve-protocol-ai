import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { signUp, resendConfirmationEmail } = useAuth();
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
    setLoading(false);

    if (signUpError) {
      toast({
        title: "Erro ao cadastrar",
        description: signUpError.message,
        variant: "destructive",
      });
      return;
    }

    setConfirmationSent(true);
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await resendConfirmationEmail(email);
    setResending(false);
    if (error) {
      toast({ title: "Erro ao reenviar", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "E-mail reenviado!",
        description: "Verifique sua caixa de entrada e a pasta de spam.",
      });
    }
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            Verifique seu e-mail
          </h1>
          <p className="text-sm text-muted-foreground mb-1">
            Enviamos um link de confirmação para
          </p>
          <p className="text-sm font-semibold text-foreground mb-5 break-all">{email}</p>

          <div className="bg-secondary/40 border border-border rounded-lg p-4 text-left space-y-2 mb-5">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Abra o e-mail e clique em <strong className="text-foreground">"Confirmar"</strong> para ativar sua conta.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Não esqueça de checar a <strong className="text-foreground">caixa de spam</strong> ou promoções.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Após confirmar, faça login para iniciar seu protocolo.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mb-2"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
          </Button>
          <Button className="w-full glow" onClick={() => navigate("/login")}>
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

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
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="mt-1" />
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
