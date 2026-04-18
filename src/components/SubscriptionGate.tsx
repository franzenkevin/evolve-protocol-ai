import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Blocks access to all student-facing routes when the user does NOT have an
 * active subscription. Redirects to /plans.
 *
 * Admins bypass this gate (they should never be billed).
 */
const SubscriptionGate = ({ children }: { children: React.ReactNode }) => {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (subLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Admins bypass paywall
  if (isAdmin) return <>{children}</>;

  const isActive =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    (!subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date());

  // Already on /plans? let it through to avoid redirect loop
  if (!isActive && location.pathname !== "/plans") {
    return <Navigate to="/plans" replace />;
  }

  return <>{children}</>;
};

export default SubscriptionGate;
