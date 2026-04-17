import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const isEmailNotConfirmed = (msg: string) =>
  msg.toLowerCase().includes("email not confirmed") ||
  msg.toLowerCase().includes("email_not_confirmed");

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const { signIn, resendConfirmationEmail } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setEmailNotConfirmed(false);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (isEmailNotConfirmed(error.message)) {
        setEmailNotConfirmed(true);
        setErrorMsg("Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e a pasta de spam).");
        toast({
          title: "E-mail não confirmado",
          description: "Confirme seu e-mail antes de entrar.",
          variant: "destructive",
        });
      } else if (error.message.toLowerCase().includes("invalid login credentials") || error.message.toLowerCase().includes("invalid_credentials")) {
        setErrorMsg("E-mail ou senha incorretos. Verifique seus dados e tente novamente.");
        toast({ title: "Credenciais inválidas", description: "E-mail ou senha incorretos.", variant: "destructive" });
      } else {
        const msg = error.message || "Ocorreu um erro ao entrar. Tente novamente.";
        setErrorMsg(msg);
        toast({ title: "Erro ao entrar", description: msg, variant: "destructive" });
      }
    } else {
      navigate("/dashboard");
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({ title: "Informe o e-mail", description: "Digite seu e-mail no campo acima.", variant: "destructive" });
      return;
    }
    setResending(true);
    const { error } = await resendConfirmationEmail(email);
    setResending(false);
    if (error) {
      toast({ title: "Erro ao reenviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail reenviado!", description: "Verifique sua caixa de entrada e confirme o e-mail." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Hypertrophy" className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-heading font-bold text-foreground">Hypertrophy</h1>
          <p className="text-muted-foreground mt-1">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </div>

          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {emailNotConfirmed && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resending}
              onClick={handleResend}
            >
              {resending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
            </Button>
          )}

          <Button type="submit" className="w-full glow" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Esqueci minha senha</Link>
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
