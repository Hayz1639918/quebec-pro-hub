import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Professionals from "./pages/Professionals";
import Projects from "./pages/Projects";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import Messages from "./pages/Messages";
import Contracts from "./pages/Contracts";
import Notifications from "./pages/Notifications";
import VerifySignature from "./pages/VerifySignature";
import NotFound from "./pages/NotFound";
import ProProfile from "./pages/ProProfile";
import ProSubscription from "./pages/ProSubscription";
import ProKpis from "./pages/ProKpis";
import Subcontractors from "./pages/Subcontractors";
import SubcontractorTasks from "./pages/SubcontractorTasks";
import ProposeContract from "./pages/ProposeContract";
import ReviewContractProposals from "./pages/ReviewContractProposals";
import ProReviews from "./pages/ProReviews";
import ProDashboard from "./pages/ProDashboard";
import ProContracts from "./pages/ProContracts";
import ProPortfolio from "./pages/ProPortfolio";
import ProCalendar from "./pages/ProCalendar";
import ProjectDetails from "./pages/ProjectDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TenderView from "./pages/TenderView";
import ProposalView from "./pages/ProposalView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/professionals" element={<Professionals />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/tender/:id" element={<TenderView />} />
          <Route path="/proposal/:id" element={<ProposalView />} />
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/new-project" element={<NewProject />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/contracts/verify/:verificationCode" element={<VerifySignature />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
