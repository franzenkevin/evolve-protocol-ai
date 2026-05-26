import { ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/evoria-logo-horizontal.png";

interface QuizShellProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideProgress?: boolean;
}

export default function QuizShell({
  currentStep,
  totalSteps,
  onBack,
  children,
  footer,
  hideProgress,
}: QuizShellProps) {
  const pct = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));
  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/85 backdrop-blur border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            disabled={!onBack}
            className="p-2 -ml-2 rounded-full text-foreground/80 hover:bg-white/5 disabled:opacity-30"
            aria-label="Voltar"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <img src={logo} alt="Evoria" className="h-7 w-auto" />
          </div>
          <div className="w-8" />
        </div>
        {!hideProgress && (
          <div className="max-w-xl mx-auto px-4 pb-3">
            <div className="flex items-center gap-3">
              <Progress value={pct} className="h-1.5 bg-white/10" />
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-12 text-right">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Body */}
      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-6 pb-32 animate-fade-in">
        {children}
      </main>

      {/* Footer (CTA) */}
      {footer && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">{footer}</div>
        </div>
      )}
    </div>
  );
}
