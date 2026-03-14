import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedProRoute from "@/components/ProtectedProRoute";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const PendingVerification = lazy(() => import("./pages/PendingVerification"));
const Professionals = lazy(() => import("./pages/Professionals"));
const Projects = lazy(() => import("./pages/Projects"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewProject = lazy(() => import("./pages/NewProject"));
const EditProject = lazy(() => import("./pages/EditProject"));
const Messages = lazy(() => import("./pages/Messages"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Notifications = lazy(() => import("./pages/Notifications"));
const VerifySignature = lazy(() => import("./pages/VerifySignature"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProProfile = lazy(() => import("./pages/ProProfile"));
const ProSubscription = lazy(() => import("./pages/ProSubscription"));
const ProKpis = lazy(() => import("./pages/ProKpis"));
const Subcontractors = lazy(() => import("./pages/Subcontractors"));
const SubcontractorTasks = lazy(() => import("./pages/SubcontractorTasks"));
const ProposeContract = lazy(() => import("./pages/ProposeContract"));
const ReviewContractProposals = lazy(() => import("./pages/ReviewContractProposals"));
const ProReviews = lazy(() => import("./pages/ProReviews"));
const ProDashboard = lazy(() => import("./pages/ProDashboard"));
const ProContracts = lazy(() => import("./pages/ProContracts"));
const ProPortfolio = lazy(() => import("./pages/ProPortfolio"));
const ProCalendar = lazy(() => import("./pages/ProCalendar"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TenderView = lazy(() => import("./pages/TenderView"));
const ProposalView = lazy(() => import("./pages/ProposalView"));
const ProfessionalProfile = lazy(() => import("./pages/ProfessionalProfile"));
const ProjectProgress = lazy(() => import("./pages/ProjectProgress"));
const ProjectReport = lazy(() => import("./pages/ProjectReport"));
const ProMyProjects = lazy(() => import("./pages/ProMyProjects"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
// Epic 10-18 — Entrepreneur pages
const CompleteProfileEntrepreneur = lazy(() => import("./pages/CompleteProfileEntrepreneur"));
const ProEntrepreneurProfile = lazy(() => import("./pages/ProEntrepreneurProfile"));
const ProBankAccount = lazy(() => import("./pages/ProBankAccount"));
const ProMeetings = lazy(() => import("./pages/ProMeetings"));
const ProPayments = lazy(() => import("./pages/ProPayments"));
const ProInvoices = lazy(() => import("./pages/ProInvoices"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-muted-foreground text-sm">Chargement...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/complete-profile-entrepreneur" element={<CompleteProfileEntrepreneur />} />
              <Route path="/pending-verification" element={<PendingVerification />} />
              <Route path="/professionals" element={<Professionals />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/project/:id" element={<ProjectDetails />} />
              <Route path="/tender/:id" element={<TenderView />} />
              <Route path="/proposal/:id" element={<ProposalView />} />
              <Route path="/professional/:id" element={<ProfessionalProfile />} />
              {/* All /pro/* routes require a professional account */}
              <Route element={<ProtectedProRoute />}>
                <Route path="/pro/dashboard" element={<ProDashboard />} />
                <Route path="/pro/profile" element={<ProProfile />} />
                <Route path="/pro/subscription" element={<ProSubscription />} />
                <Route path="/pro/kpis" element={<ProKpis />} />
                <Route path="/pro/subcontractors" element={<Subcontractors />} />
                <Route path="/pro/subcontractor-tasks" element={<SubcontractorTasks />} />
                <Route path="/pro/contract-proposals/new" element={<ProposeContract />} />
                <Route path="/proposals/review" element={<ReviewContractProposals />} />
                <Route path="/pro/reviews" element={<ProReviews />} />
                <Route path="/pro/contracts" element={<ProContracts />} />
                <Route path="/pro/portfolio" element={<ProPortfolio />} />
                <Route path="/pro/calendar" element={<ProCalendar />} />
                <Route path="/pro/project/:id/progress" element={<ProjectProgress />} />
                <Route path="/pro/project/:id/report" element={<ProjectReport />} />
                <Route path="/pro/my-projects" element={<ProMyProjects />} />
                <Route path="/pro/entrepreneur-profile" element={<ProEntrepreneurProfile />} />
                <Route path="/pro/bank-account" element={<ProBankAccount />} />
                <Route path="/pro/meetings" element={<ProMeetings />} />
                <Route path="/pro/payments" element={<ProPayments />} />
                <Route path="/pro/invoices" element={<ProInvoices />} />
              </Route>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/profile" element={<ClientProfile />} />
              <Route path="/dashboard/new-project" element={<NewProject />} />
              <Route path="/edit-project/:id" element={<EditProject />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/contracts/verify/:verificationCode" element={<VerifySignature />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
