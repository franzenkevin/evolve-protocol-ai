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
import AdminGate from "./components/AdminGate";
import StudentGate from "./components/StudentGate";
import SubscriptionGate from "./components/SubscriptionGate";
import Welcome from "./pages/Welcome";
import Terms from "./pages/Terms";
import AcceptTerms from "./pages/AcceptTerms";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Plans from "./pages/Plans";
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
  // Send new students to /welcome instead of forcing /onboarding directly
  if (!profile || !profile.onboarding_complete) return <Navigate to="/welcome" replace />;
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
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/welcome" element={<ProtectedRoute><StudentGate><Welcome /></StudentGate></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><StudentGate><Onboarding /></StudentGate></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><StudentGate><OnboardingGate><Dashboard /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/training" element={<ProtectedRoute><StudentGate><OnboardingGate><Training /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/diet" element={<ProtectedRoute><StudentGate><OnboardingGate><Diet /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><StudentGate><OnboardingGate><Progress /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><StudentGate><OnboardingGate><Exams /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><StudentGate><OnboardingGate><Journal /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><StudentGate><OnboardingGate><Chat /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminGate><Admin /></AdminGate></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/accept-terms" element={<ProtectedRoute><AcceptTerms /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><StudentGate><OnboardingGate><Profile /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><StudentGate><OnboardingGate><EditProfile /></OnboardingGate></StudentGate></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
