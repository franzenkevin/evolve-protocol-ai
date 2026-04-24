import { Navigate, useLocation } from "react-router-dom";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Garante que o usuário (não-admin) já tem um protocolo ativo gerado antes de
 * acessar telas internas (dashboard, treino, dieta, etc.).
 *
 * Quando ele já pagou mas o protocolo ainda não foi gerado, redireciona para
 * /checkout/success que dispara a geração automática.
 */
const ProtocolGate = ({ children }: { children: React.ReactNode }) => {
  const { data: protocol, isLoading } = useActiveProtocol();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (isLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Admins não precisam de protocolo
  if (isAdmin) return <>{children}</>;

  if (!protocol && location.pathname !== "/checkout/success") {
    return <Navigate to="/checkout/success" replace />;
  }

  return <>{children}</>;
};

export default ProtocolGate;
