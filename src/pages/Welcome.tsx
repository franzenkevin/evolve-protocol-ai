import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarClock,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Camera,
  Ruler,
  Sun,
  Shirt,
  CheckCircle2,
} from "lucide-react";
import logo from "@/assets/logo.png";
import poseFront from "@/assets/pose-front.png";
import poseBack from "@/assets/pose-back.png";
import poseRight from "@/assets/pose-right.png";
import poseLeft from "@/assets/pose-left.png";

const POSES = [
  { src: poseFront, label: "Frente", desc: "Braços relaxados ao lado" },
  { src: poseBack, label: "Costas", desc: "De costas para a câmera" },
  { src: poseRight, label: "Lateral D", desc: "Perfil direito" },
  { src: poseLeft, label: "Lateral E", desc: "Perfil esquerdo" },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isLoading && profile?.onboarding_complete) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || "Atleta").split(" ")[0];

  const features = [
    { icon: Dumbbell, label: "Treino personalizado pela sua metodologia" },
    { icon: UtensilsCrossed, label: "Dieta com seus alimentos preferidos" },
    { icon: TrendingUp, label: "Revisão automática a cada 60 dias" },
  ];

  const photoTips = [
    { icon: Ruler, text: "Distância de ~2 metros da câmera" },
    { icon: Sun, text: "Boa iluminação e fundo neutro" },
    { icon: Shirt, text: "Roupa justa, traje de banho ou sunga" },
    { icon: CheckCircle2, text: "Postura natural, sem contrair" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="w-full max-w-md mx-auto animate-fade-in space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Hypertrophy" className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Bem-vindo, <span className="text-gradient">{firstName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Antes de começar, entenda como funciona seu primeiro protocolo
          </p>
        </div>

        {/* Features */}
        <Card className="p-5 card-gradient border-border space-y-3">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-primary" />
              </div>
              <p className="text-sm text-foreground pt-1.5">{label}</p>
            </div>
          ))}
        </Card>

        {/* Quiz único */}
        <Card className="p-4 border-primary/40 bg-primary/5">
          <div className="flex gap-3">
            <CalendarClock size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Quiz único a cada 60 dias
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você responderá <strong className="text-foreground">uma única vez</strong> e suas
                respostas montarão seu treino e dieta pelos próximos{" "}
                <strong className="text-primary">60 dias</strong>. Por isso, responda{" "}
                <strong className="text-foreground">com calma e sinceridade</strong> — quanto melhor
                a resposta, melhor seu protocolo.
              </p>
            </div>
          </div>
        </Card>

        {/* Avaliação física */}
        <Card className="p-4 border-border bg-card space-y-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Camera size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Avaliação física por fotos
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ao final do quiz, você enviará <strong className="text-foreground">4 fotos</strong>{" "}
                do seu corpo. Nossa IA analisará composição, postura e simetria para personalizar
                ainda mais seu treino.
              </p>
            </div>
          </div>

          {/* Silhuetas de exemplo */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              As 4 poses
            </p>
            <div className="grid grid-cols-4 gap-2">
              {POSES.map((pose) => (
                <div key={pose.label} className="space-y-1">
                  <div className="aspect-[2/3] rounded-md overflow-hidden bg-muted/30 border border-border">
                    <img
                      src={pose.src}
                      alt={`Pose ${pose.label}`}
                      width={512}
                      height={768}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-foreground text-center leading-tight">
                    {pose.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dicas */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              Como tirar boas fotos
            </p>
            {photoTips.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={12} className="text-primary shrink-0" />
                <p className="text-xs text-foreground">{text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full glow gap-2 h-14 text-base"
          onClick={() => setConfirmOpen(true)}
        >
          Iniciar meu primeiro quiz <ArrowRight size={18} />
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          Tempo estimado: 5 a 8 minutos · Responda com calma e sinceridade
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
              <AlertTriangle size={22} className="text-primary" />
            </div>
            <AlertDialogTitle>Confirma iniciar o quiz?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Este questionário é <strong className="text-foreground">único</strong> e suas
                respostas montarão seu protocolo pelos próximos{" "}
                <strong className="text-primary">60 dias</strong>.
              </span>
              <span className="block">
                Reserve alguns minutos sem pressa. Você não poderá refazê-lo até o próximo ciclo.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Agora não</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/onboarding")}>
              Sim, vamos começar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Welcome;
