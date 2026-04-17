import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Blocks admins from seeing student-only screens.
 * Admin should only ever see /admin (or public pages like /terms, /profile).
 */
const StudentGate = ({ children }: { children: React.ReactNode }) => {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
};

export default StudentGate;
