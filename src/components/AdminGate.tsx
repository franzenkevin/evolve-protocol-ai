import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import AdminMFAEnroll from "@/components/admin/AdminMFAEnroll";
import AdminMFAChallenge from "@/components/admin/AdminMFAChallenge";

type MfaState = "checking" | "enroll" | "challenge" | "verified";

const AdminGate = ({ children }: { children: React.ReactNode }) => {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [mfaState, setMfaState] = useState<MfaState>("checking");

  const checkMfa = async () => {
    setMfaState("checking");
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") {
      setMfaState("verified");
      return;
    }
    const { data: list } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = list?.all?.some((f) => f.factor_type === "totp" && f.status === "verified");
    setMfaState(hasVerifiedTotp ? "challenge" : "enroll");
  };

  useEffect(() => {
    if (isAdmin) checkMfa();
  }, [isAdmin]);

  if (isLoading || (isAdmin && mfaState === "checking")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  if (mfaState === "enroll") return <AdminMFAEnroll onEnrolled={checkMfa} />;
  if (mfaState === "challenge") return <AdminMFAChallenge onVerified={checkMfa} />;

  return <>{children}</>;
};

export default AdminGate;
