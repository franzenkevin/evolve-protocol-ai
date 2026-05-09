import { lazy, Suspense, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
const LAZY_IMPORT_RELOAD_KEY = "lazy-import-reload-attempted";

const isRecoverableImportError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
    message,
  );
};

const lazyWithRecovery = <T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
) =>
  lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(LAZY_IMPORT_RELOAD_KEY);
      return module;
    } catch (error) {
      if (
        typeof window !== "undefined" &&
        isRecoverableImportError(error) &&
        !sessionStorage.getItem(LAZY_IMPORT_RELOAD_KEY)
      ) {
        sessionStorage.setItem(LAZY_IMPORT_RELOAD_KEY, "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }

      sessionStorage.removeItem(LAZY_IMPORT_RELOAD_KEY);
      throw error;
    }
  });

const Index = lazyWithRecovery(() => import("./pages/Index"));
const Login = lazyWithRecovery(() => import("./pages/Login"));
const Signup = lazyWithRecovery(() => import("./pages/Signup"));
const ForgotPassword = lazyWithRecovery(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRecovery(() => import("./pages/ResetPassword"));
const Onboarding = lazyWithRecovery(() => import("./pages/Onboarding"));
const Dashboard = lazyWithRecovery(() => import("./pages/Dashboard"));
const Training = lazyWithRecovery(() => import("./pages/Training"));
const Diet = lazyWithRecovery(() => import("./pages/Diet"));
const Progress = lazyWithRecovery(() => import("./pages/Progress"));
const Exams = lazyWithRecovery(() => import("./pages/Exams"));
const Journal = lazyWithRecovery(() => import("./pages/Journal"));
const Chat = lazyWithRecovery(() => import("./pages/Chat"));
const Admin = lazyWithRecovery(() => import("./pages/Admin"));
import AdminGate from "./components/AdminGate";
import StudentGate from "./components/StudentGate";
import SubscriptionGate from "./components/SubscriptionGate";
import ProtocolGate from "./components/ProtocolGate";
const Welcome = lazyWithRecovery(() => import("./pages/Welcome"));
const Terms = lazyWithRecovery(() => import("./pages/Terms"));
const AcceptTerms = lazyWithRecovery(() => import("./pages/AcceptTerms"));
const Profile = lazyWithRecovery(() => import("./pages/Profile"));
const EditProfile = lazyWithRecovery(() => import("./pages/EditProfile"));
const Plans = lazyWithRecovery(() => import("./pages/Plans"));
const CheckoutSuccess = lazyWithRecovery(() => import("./pages/CheckoutSuccess"));
const CreatePassword = lazyWithRecovery(() => import("./pages/CreatePassword"));
const NewProtocol = lazyWithRecovery(() => import("./pages/NewProtocol"));
const NotFound = lazyWithRecovery(() => import("./pages/NotFound"));
const Feedback = lazyWithRecovery(() => import("./pages/Feedback"));
const MilestoneCheckin = lazyWithRecovery(() => import("./pages/MilestoneCheckin"));
const Support = lazyWithRecovery(() => import("./pages/Support"));
const Install = lazyWithRecovery(() => import("./pages/Install"));
import InstallPrompt from "./components/InstallPrompt";
import { UpdateAvailableBanner } from "./components/UpdateAvailableBanner";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Navigate to="/signup" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/welcome" element={<ProtectedRoute><StudentGate><Welcome /></StudentGate></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><StudentGate><Onboarding /></StudentGate></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Dashboard /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Training /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/diet" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Diet /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Progress /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/exams" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Exams /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/journal" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Journal /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Chat /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminGate><Admin /></AdminGate></ProtectedRoute>} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/instalar" element={<Install />} />
              <Route path="/install" element={<Navigate to="/instalar" replace />} />
              <Route path="/accept-terms" element={<ProtectedRoute><AcceptTerms /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><StudentGate><SubscriptionGate><Profile /></SubscriptionGate></StudentGate></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><StudentGate><SubscriptionGate><EditProfile /></SubscriptionGate></StudentGate></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><StudentGate><SubscriptionGate><Support /></SubscriptionGate></StudentGate></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><Feedback /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/checkin/:milestone" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><MilestoneCheckin /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute><StudentGate><Plans /></StudentGate></ProtectedRoute>} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/criar-senha" element={<CreatePassword />} />
              <Route path="/create-password" element={<Navigate to="/criar-senha" replace />} />
              <Route path="/new-protocol" element={<ProtectedRoute><StudentGate><OnboardingGate><SubscriptionGate><ProtocolGate><NewProtocol /></ProtocolGate></SubscriptionGate></OnboardingGate></StudentGate></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <InstallPrompt />
          <UpdateAvailableBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
