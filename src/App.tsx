import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Training from "./pages/Training";
import Diet from "./pages/Diet";
import Progress from "./pages/Progress";
import Exams from "./pages/Exams";
import Journal from "./pages/Journal";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Terms from "./pages/Terms";
import AcceptTerms from "./pages/AcceptTerms";
import NotFound from "./pages/NotFound";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { data: profile, isLoading } = useProfile();
  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile || !profile.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><OnboardingGate><Dashboard /></OnboardingGate></ProtectedRoute>} />
            <Route path="/training" element={<ProtectedRoute><OnboardingGate><Training /></OnboardingGate></ProtectedRoute>} />
            <Route path="/diet" element={<ProtectedRoute><OnboardingGate><Diet /></OnboardingGate></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><OnboardingGate><Progress /></OnboardingGate></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><OnboardingGate><Exams /></OnboardingGate></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><OnboardingGate><Journal /></OnboardingGate></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><OnboardingGate><Chat /></OnboardingGate></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/accept-terms" element={<ProtectedRoute><AcceptTerms /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
