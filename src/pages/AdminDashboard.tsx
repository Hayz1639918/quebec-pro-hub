/**
 * Admin Dashboard - Secure panel for RBQ verification
 * 
 * Security measures implemented:
 * - Server-side admin verification via RLS policies
 * - Audit logging for all admin actions
 * - Input validation
 * - Rate limiting via Supabase
 * - No sensitive data exposed in client
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminLicensePanel from "@/components/admin/AdminLicensePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Users,
  Building2,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Eye,
  Search,
  RefreshCw,
  Activity,
  TrendingUp,
  FileText,
  Briefcase,
  Gavel,
  Flag,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PendingVerification {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  company_name: string | null;
  rbq_number: string | null;
  rbq_certification_url: string | null;
  services_offered: string | null;
  insurance_info: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  professional_type: string | null;
  trade_specialty: string | null;
  created_at: string;
  missing_certification: boolean;
}

interface RejectedProfessional {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  company_name: string;
  rbq_number: string;
  rbq_certification_url: string | null;
  city: string | null;
  region: string | null;
  rbq_rejection_reason: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total_clients: number;
  total_professionals: number;
  verified_professionals: number;
  pending_verifications: number;
  total_projects: number;
  open_projects: number;
  total_contracts: number;
  signed_contracts: number;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
}

interface AdminDispute {
  id: string;
  contract_id: string;
  opened_by: string;
  category: string;
  description: string;
  status: string;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  contract_title?: string;
  client_name?: string;
  professional_name?: string;
  opener_name?: string;
}

interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  review_comment?: string | null;
  review_rating?: number | null;
}

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id: string | null;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "pending";
  const { toast } = useToast();

  // Security state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [rejectedProfessionals, setRejectedProfessionals] = useState<RejectedProfessional[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Disputes state
  const [reviewReports, setReviewReports] = useState<ReviewReport[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);
  const [disputeResolution, setDisputeResolution] = useState("");
  const [disputeNewStatus, setDisputeNewStatus] = useState("");
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);

  // Dialog state
  const [selectedProfessional, setSelectedProfessional] = useState<PendingVerification | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Security: Verify admin status
  const verifyAdminAccess = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return false;
      }

      // Check admin status via RPC (server-side verification)
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        return false;
      }

      setIsAdmin(data === true);
      return data === true;
    } catch (error) {
      console.error('Admin verification error:', error);
      setIsAdmin(false);
      return false;
    }
  }, [navigate]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch pending verifications
  const fetchPendingVerifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_pending_verifications')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingVerifications(data || []);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
    }
  }, []);

  // Fetch rejected professionals
  const fetchRejectedProfessionals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_rejected_professionals')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRejectedProfessionals(data || []);
    } catch (error) {
      console.error('Error fetching rejected professionals:', error);
    }
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`
          *,
          profiles:admin_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const logsWithNames = (data || []).map(log => ({
        ...log,
        admin_name: (log.profiles as { full_name: string } | null)?.full_name || 'Unknown'
      }));
      
      setAuditLogs(logsWithNames);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  }, []);

  // Fetch disputes with related data
  const fetchDisputes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const disputesWithDetails: AdminDispute[] = await Promise.all(
        (data || []).map(async (dispute) => {
          let contractTitle = '';
          let clientName = '';
          let professionalName = '';
          let openerName = '';

          const { data: contractData } = await supabase
            .from('contracts')
            .select('title, client_id, professional_id')
            .eq('id', dispute.contract_id)
            .single();

          if (contractData) {
            contractTitle = contractData.title || '';

            const { data: clientData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', contractData.client_id)
              .single();
            clientName = clientData?.full_name || '';

            const { data: proData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', contractData.professional_id)
              .single();
            professionalName = proData?.full_name || '';
          }

          const { data: openerData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', dispute.opened_by)
            .single();
          openerName = openerData?.full_name || '';

          return {
            ...dispute,
            contract_title: contractTitle,
            client_name: clientName,
            professional_name: professionalName,
            opener_name: openerName,
          };
        })
      );

      setDisputes(disputesWithDetails);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    }
  }, []);

  // Handle dispute resolution
  const handleUpdateDispute = async () => {
    if (!selectedDispute || !disputeNewStatus) return;

    setActionLoading(selectedDispute.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const updateData: Record<string, unknown> = {
        status: disputeNewStatus,
      };

      if (disputeResolution.trim()) {
        updateData.resolution = disputeResolution.trim();
      }

      if (disputeNewStatus === 'resolved' || disputeNewStatus === 'closed') {
        updateData.resolved_by = session?.user?.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', selectedDispute.id);

      if (error) throw error;

      toast({
        title: "Litige mis à jour",
        description: `Le statut a été changé en "${disputeNewStatus}".`,
      });

      setDisputeDialogOpen(false);
      setSelectedDispute(null);
      setDisputeResolution("");
      setDisputeNewStatus("");
      await fetchDisputes();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const fetchReviewReports = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from("review_reports")
        .select("id, review_id, reporter_id, reason, detail, status, created_at")
        .order("created_at", { ascending: false });
      const rows = (data || []) as ReviewReport[];
      const reporterIds = [...new Set(rows.map((r) => r.reporter_id))];
      const reviewIds = [...new Set(rows.map((r) => r.review_id))];
      const [reporters, reviews] = await Promise.all([
        reporterIds.length ? supabase.from("profiles").select("id, full_name").in("id", reporterIds) : Promise.resolve({ data: [] }),
        reviewIds.length ? supabase.from("reviews").select("id, comment, rating").in("id", reviewIds) : Promise.resolve({ data: [] }),
      ]);
      const rmap = new Map((reporters.data || []).map((p: any) => [p.id, p.full_name]));
      const vmap = new Map((reviews.data || []).map((v: any) => [v.id, v]));
      setReviewReports(rows.map((r) => ({
        ...r,
        reporter_name: rmap.get(r.reporter_id) || "Utilisateur",
        review_comment: vmap.get(r.review_id)?.comment ?? null,
        review_rating: vmap.get(r.review_id)?.rating ?? null,
      })));
    } catch (e) {
      console.error("Error fetching review reports:", e);
    }
  }, []);

  const fetchUserReports = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from("user_reports")
        .select("id, reporter_id, reported_user_id, conversation_id, reason, detail, status, created_at")
        .order("created_at", { ascending: false });
      const rows = (data || []) as UserReport[];
      const ids = [...new Set([...rows.map((r) => r.reporter_id), ...rows.map((r) => r.reported_user_id)])];
      const profiles = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
      const pmap = new Map((profiles.data || []).map((p: any) => [p.id, p.full_name]));
      setUserReports(rows.map((r) => ({
        ...r,
        reporter_name: pmap.get(r.reporter_id) || "Utilisateur",
        reported_name: pmap.get(r.reported_user_id) || "Utilisateur",
      })));
    } catch (e) {
      console.error("Error fetching user reports:", e);
    }
  }, []);

  const handleModerationStatus = async (
    table: "review_reports" | "user_reports",
    id: string,
    status: "resolved" | "dismissed",
  ) => {
    setActionLoading(id);
    try {
      const { error } = await (supabase as any).from(table).update({ status }).eq("id", id);
      if (error) throw error;
      toast({ title: "Signalement traité", description: status === "resolved" ? "Marqué comme résolu." : "Signalement rejeté." });
      if (table === "review_reports") await fetchReviewReports();
      else await fetchUserReports();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Action impossible." });
    } finally {
      setActionLoading(null);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const hasAccess = await verifyAdminAccess();
      
      if (hasAccess) {
        await Promise.all([
          fetchStats(),
          fetchPendingVerifications(),
          fetchRejectedProfessionals(),
          fetchAuditLogs(),
          fetchDisputes(),
          fetchReviewReports(),
          fetchUserReports()
        ]);
      }
      
      setLoading(false);
    };

    init();
  }, [verifyAdminAccess, fetchStats, fetchPendingVerifications, fetchRejectedProfessionals, fetchAuditLogs, fetchDisputes, fetchReviewReports, fetchUserReports]);

  // Handle RBQ verification
  const handleVerifyRBQ = async (professional: PendingVerification) => {
    setActionLoading(professional.id);
    
    try {
      const { data, error } = await supabase.rpc('admin_verify_rbq', {
        p_professional_id: professional.id,
        p_notes: verifyNotes || null
      });

      if (error) throw error;

      toast({
        title: "Licence RBQ vérifiée",
        description: `${professional.company_name} peut maintenant recevoir des projets.`,
      });

      // Refresh data
      await Promise.all([fetchStats(), fetchPendingVerifications(), fetchAuditLogs()]);
      setVerifyNotes("");
      setDetailsDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la vérification";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle RBQ rejection
  const handleRejectRBQ = async () => {
    if (!selectedProfessional) return;
    
    if (rejectReason.length < 10) {
      toast({
        variant: "destructive",
        title: "Raison requise",
        description: "Veuillez fournir une raison d'au moins 10 caractères.",
      });
      return;
    }

    setActionLoading(selectedProfessional.id);
    
    try {
      const { data, error } = await supabase.rpc('admin_reject_rbq', {
        p_professional_id: selectedProfessional.id,
        p_reason: rejectReason
      });

      if (error) throw error;

      toast({
        title: "Licence RBQ refusée",
        description: `La demande de ${selectedProfessional.company_name} a été refusée.`,
      });

      // Refresh data
      await Promise.all([fetchStats(), fetchPendingVerifications(), fetchRejectedProfessionals(), fetchAuditLogs()]);
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedProfessional(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors du refus";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete rejected account (allows user to re-register)
  const handleDeleteRejectedAccount = async (professional: RejectedProfessional) => {
    setActionLoading(professional.id);
    
    try {
      const { data, error } = await supabase.rpc('admin_delete_rejected_account', {
        p_professional_id: professional.id
      });

      if (error) throw error;

      toast({
        title: "Compte supprimé",
        description: `${professional.email} peut maintenant se réinscrire.`,
      });

      await Promise.all([fetchStats(), fetchRejectedProfessionals(), fetchAuditLogs()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle allow resubmission (keeps account, clears rejection)
  const handleAllowResubmission = async (professional: RejectedProfessional) => {
    setActionLoading(professional.id);
    
    try {
      const { data, error } = await supabase.rpc('admin_allow_resubmission', {
        p_professional_id: professional.id
      });

      if (error) throw error;

      toast({
        title: "Nouvelle chance accordée",
        description: `${professional.company_name} peut resoumettre sa demande.`,
      });

      await Promise.all([fetchStats(), fetchPendingVerifications(), fetchRejectedProfessionals(), fetchAuditLogs()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'opération";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Filter pending verifications
  const filteredPending = pendingVerifications.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.company_name ?? "").toLowerCase().includes(term) ||
      p.full_name.toLowerCase().includes(term) ||
      (p.rbq_number ?? "").toLowerCase().includes(term) ||
      (p.trade_specialty ?? "").toLowerCase().includes(term)
    );
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Accès refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate("/")}
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Panneau d'administration</h1>
              <p className="text-muted-foreground">Gestion des vérifications RBQ</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchStats();
              fetchPendingVerifications();
              fetchRejectedProfessionals();
              fetchAuditLogs();
              fetchDisputes();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_clients}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Professionnels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.verified_professionals}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{stats.total_professionals}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">vérifiés</p>
              </CardContent>
            </Card>
            
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  En attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {stats.pending_verifications}
                </div>
                <p className="text-xs text-muted-foreground">vérifications</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Projets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.open_projects}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{stats.total_projects}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">ouverts</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs
          value={initialTab}
          onValueChange={(value) => setSearchParams({ tab: value })}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Vérifications en attente
              {stats && stats.pending_verifications > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.pending_verifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <ShieldX className="h-4 w-4" />
              Refusés
              {rejectedProfessionals.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {rejectedProfessionals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Litiges
              {disputes.filter(d => d.status === 'open' || d.status === 'investigating').length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {disputes.filter(d => d.status === 'open' || d.status === 'investigating').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Modération
              {(reviewReports.filter(r => r.status === 'pending').length + userReports.filter(r => r.status === 'pending').length) > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {reviewReports.filter(r => r.status === 'pending').length + userReports.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Journal d'audit
            </TabsTrigger>
          </TabsList>

          {/* Pending Verifications Tab */}
          <TabsContent value="pending" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par entreprise, nom ou RBQ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Pending List */}
            {filteredPending.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">Aucune vérification en attente</h3>
                  <p className="text-muted-foreground">
                    Toutes les demandes ont été traitées.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Professionnel</TableHead>
                      <TableHead>Type / Licence</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Date inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((pro) => (
                      <TableRow key={pro.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pro.company_name || pro.full_name}</p>
                            <p className="text-sm text-muted-foreground">{pro.full_name}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {pro.professional_type === 'trade_professional' ? 'Métier' : 'Entrepreneur'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {pro.professional_type === 'trade_professional' ? (
                              <span className="bg-muted px-2 py-1 rounded text-sm">{pro.trade_specialty || '—'}</span>
                            ) : (
                              <code className="bg-muted px-2 py-1 rounded text-sm">{pro.rbq_number || '—'}</code>
                            )}
                            {pro.missing_certification && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Sans doc
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pro.city && pro.region ? (
                            `${pro.city}, ${pro.region}`
                          ) : (
                            <span className="text-muted-foreground">Non spécifiée</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(pro.created_at), "d MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProfessional(pro);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Examiner
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Rejected Professionals Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedProfessionals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">Aucun compte refusé</h3>
                  <p className="text-muted-foreground">
                    Il n'y a pas de demandes refusées en ce moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldX className="h-5 w-5 text-destructive" />
                    Comptes refusés
                  </CardTitle>
                  <CardDescription>
                    Vous pouvez supprimer un compte pour permettre une réinscription, ou autoriser une nouvelle soumission.
                  </CardDescription>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Raison du refus</TableHead>
                      <TableHead>Date refus</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedProfessionals.map((pro) => (
                      <TableRow key={pro.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pro.company_name}</p>
                            <p className="text-sm text-muted-foreground">{pro.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{pro.email}</TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-[200px] truncate" title={pro.rbq_rejection_reason}>
                            {pro.rbq_rejection_reason}
                          </p>
                        </TableCell>
                        <TableCell>
                          {format(new Date(pro.updated_at), "d MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAllowResubmission(pro)}
                              disabled={actionLoading === pro.id}
                              title="Permet au professionnel de resoumettre sa demande"
                            >
                              {actionLoading === pro.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Autoriser
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRejectedAccount(pro)}
                              disabled={actionLoading === pro.id}
                              title="Supprime le compte pour permettre une réinscription"
                            >
                              {actionLoading === pro.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-4">
            {disputes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">Aucun litige</h3>
                  <p className="text-muted-foreground">
                    Il n'y a aucun litige enregistré pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Gestion des litiges
                  </CardTitle>
                  <CardDescription>
                    {disputes.filter(d => d.status === 'open').length} ouvert(s), {disputes.filter(d => d.status === 'investigating').length} en examen
                  </CardDescription>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contrat</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => {
                      const categoryLabels: Record<string, string> = {
                        quality: "Qualité",
                        delay: "Retard",
                        payment: "Paiement",
                        communication: "Communication",
                        other: "Autre",
                      };
                      const statusLabels: Record<string, { label: string; className: string }> = {
                        open: { label: "Ouvert", className: "bg-destructive/10 text-destructive" },
                        investigating: { label: "En examen", className: "bg-primary/10 text-primary" },
                        resolved: { label: "Résolu", className: "bg-green-100 text-green-700" },
                        closed: { label: "Fermé", className: "bg-muted text-muted-foreground" },
                      };
                      const statusCfg = statusLabels[dispute.status] || statusLabels.open;

                      return (
                        <TableRow key={dispute.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{dispute.contract_title || 'Sans titre'}</p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{dispute.client_name}</p>
                              <p className="text-muted-foreground">{dispute.professional_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {categoryLabels[dispute.category] || dispute.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(dispute.created_at), "d MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusCfg.className}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setDisputeNewStatus(dispute.status);
                                setDisputeResolution(dispute.resolution || "");
                                setDisputeDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Gérer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="moderation" className="space-y-6">
            {/* Review reports (US-040) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flag className="h-5 w-5 text-destructive" />
                  Avis signalés ({reviewReports.filter(r => r.status === 'pending').length} en attente)
                </CardTitle>
                <CardDescription>Signalements d'avis inappropriés à examiner</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucun avis signalé.</p>
                ) : (
                  <div className="space-y-3">
                    {reviewReports.map((r) => (
                      <div key={r.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline">{r.reason}</Badge>
                              <Badge className={r.status === 'pending' ? 'bg-amber-100 text-amber-800' : r.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                                {r.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                par {r.reporter_name} · {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            {r.detail && <p className="text-sm mt-1">{r.detail}</p>}
                            {r.review_comment && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Avis ({r.review_rating}/5) : « {r.review_comment} »
                              </p>
                            )}
                          </div>
                          {r.status === 'pending' && (
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" variant="outline" disabled={actionLoading === r.id}
                                onClick={() => handleModerationStatus('review_reports', r.id, 'dismissed')}>
                                Rejeter
                              </Button>
                              <Button size="sm" disabled={actionLoading === r.id}
                                onClick={() => handleModerationStatus('review_reports', r.id, 'resolved')}>
                                Résoudre
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User reports (US-029) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-destructive" />
                  Utilisateurs signalés ({userReports.filter(r => r.status === 'pending').length} en attente)
                </CardTitle>
                <CardDescription>Signalements depuis la messagerie</CardDescription>
              </CardHeader>
              <CardContent>
                {userReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucun utilisateur signalé.</p>
                ) : (
                  <div className="space-y-3">
                    {userReports.map((r) => (
                      <div key={r.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline">{r.reason}</Badge>
                              <Badge className={r.status === 'pending' ? 'bg-amber-100 text-amber-800' : r.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                                {r.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              <strong>{r.reporter_name}</strong> a signalé <strong>{r.reported_name}</strong>
                            </p>
                            {r.detail && <p className="text-xs text-muted-foreground mt-1">{r.detail}</p>}
                          </div>
                          {r.status === 'pending' && (
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" variant="outline" disabled={actionLoading === r.id}
                                onClick={() => handleModerationStatus('user_reports', r.id, 'dismissed')}>
                                Rejeter
                              </Button>
                              <Button size="sm" disabled={actionLoading === r.id}
                                onClick={() => handleModerationStatus('user_reports', r.id, 'resolved')}>
                                Résoudre
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Journal des actions administratives</CardTitle>
                <CardDescription>
                  Historique des 50 dernières actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune action enregistrée.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                          </TableCell>
                          <TableCell>{log.admin_name}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={log.action === 'VERIFY_RBQ' ? 'default' : 'destructive'}
                              className={log.action === 'VERIFY_RBQ' ? 'bg-green-600' : ''}
                            >
                              {log.action === 'VERIFY_RBQ' ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" /> Vérification</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Refus</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.new_values && typeof log.new_values === 'object' && 'notes' in log.new_values 
                              ? String(log.new_values.notes) 
                              : log.new_values && typeof log.new_values === 'object' && 'rbq_rejection_reason' in log.new_values
                              ? String(log.new_values.rbq_rejection_reason)
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Examen de la demande
            </DialogTitle>
            <DialogDescription>
              Vérifiez les informations du professionnel avant de valider
            </DialogDescription>
          </DialogHeader>

          {selectedProfessional && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Entreprise</Label>
                  <p className="font-medium">{selectedProfessional.company_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsable</Label>
                  <p className="font-medium">{selectedProfessional.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedProfessional.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p>{selectedProfessional.phone || 'Non fourni'}</p>
                </div>
              </div>

              <Separator />

              {/* Certification Info */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {selectedProfessional.professional_type === 'trade_professional'
                    ? 'Informations corps de métier'
                    : 'Informations RBQ'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {selectedProfessional.professional_type === 'trade_professional' ? (
                      <>
                        <Label className="text-muted-foreground">Corps de métier</Label>
                        <p className="font-medium">{selectedProfessional.trade_specialty || '—'}</p>
                      </>
                    ) : (
                      <>
                        <Label className="text-muted-foreground">Numéro RBQ</Label>
                        <p className="font-mono text-lg">{selectedProfessional.rbq_number || '—'}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {selectedProfessional.professional_type === 'trade_professional' ? 'Carte CCQ' : 'Licence RBQ'}
                    </Label>
                    {selectedProfessional.rbq_certification_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedProfessional.rbq_certification_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir le document
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Document non téléchargé</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedProfessional.insurance_info && (
                  <div>
                    <Label className="text-muted-foreground">Assurance responsabilité civile</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => window.open(selectedProfessional.insurance_info!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir le document
                    </Button>
                  </div>
                )}

                {selectedProfessional.missing_certification && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Document manquant</p>
                        <p className="text-sm text-orange-700">
                          {selectedProfessional.professional_type === 'trade_professional'
                            ? "Ce professionnel n'a pas encore téléchargé sa carte de compétence CCQ."
                            : "Ce professionnel n'a pas encore téléchargé sa certification RBQ."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProfessional.professional_type !== 'trade_professional' && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <Label className="text-muted-foreground">Vérification externe</Label>
                    <Button
                      variant="link"
                      className="px-0 h-auto"
                      onClick={() => window.open(`https://www.rbq.gouv.qc.ca/services-en-ligne/registre-des-detenteurs-de-licence/`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Vérifier sur le site de la RBQ →
                    </Button>
                  </div>
                )}

                {/* US-112: per-license status management */}
                <Separator />
                <AdminLicensePanel professionalId={selectedProfessional.id} />
              </div>

              <Separator />

              {/* Location & Services */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Localisation</Label>
                  <p>
                    {selectedProfessional.city && selectedProfessional.region 
                      ? `${selectedProfessional.city}, ${selectedProfessional.region}`
                      : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'inscription</Label>
                  <p>{format(new Date(selectedProfessional.created_at), "d MMMM yyyy", { locale: fr })}</p>
                </div>
              </div>

              {selectedProfessional.services_offered && (
                <div>
                  <Label className="text-muted-foreground">Services offerts</Label>
                  <p className="text-sm">{selectedProfessional.services_offered}</p>
                </div>
              )}

              <Separator />

              {/* Notes */}
              <div>
                <Label htmlFor="verifyNotes">Notes de vérification (optionnel)</Label>
                <Textarea
                  id="verifyNotes"
                  placeholder="Notes internes sur cette vérification..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(true);
                setDetailsDialogOpen(false);
              }}
              disabled={actionLoading !== null}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Refuser
            </Button>
            <Button
              onClick={() => selectedProfessional && handleVerifyRBQ(selectedProfessional)}
              disabled={actionLoading !== null || selectedProfessional?.missing_certification}
              className="bg-green-600 hover:bg-green-700"
              title={selectedProfessional?.missing_certification ? "Certification requise pour valider" : undefined}
            >
              {actionLoading === selectedProfessional?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Valider la licence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Refuser la demande
            </DialogTitle>
            <DialogDescription>
              {selectedProfessional && (
                <>Refuser la demande de <strong>{selectedProfessional.company_name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Raison du refus *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Expliquez pourquoi la demande est refusée (minimum 10 caractères)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cette raison sera communiquée au professionnel.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRBQ}
              disabled={rejectReason.length < 10 || actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Management Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Gestion du litige
            </DialogTitle>
            <DialogDescription>
              {selectedDispute?.contract_title && (
                <>Contrat : <strong>{selectedDispute.contract_title}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ouvert par</Label>
                  <p className="font-medium">{selectedDispute.opener_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>{format(new Date(selectedDispute.created_at), "d MMMM yyyy", { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p>{selectedDispute.client_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Professionnel</Label>
                  <p>{selectedDispute.professional_name}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Description du litige</Label>
                <p className="mt-1 text-sm bg-muted/50 rounded-lg p-3">{selectedDispute.description}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="dispute-status">Statut</Label>
                  <Select value={disputeNewStatus} onValueChange={setDisputeNewStatus}>
                    <SelectTrigger id="dispute-status">
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="investigating">En examen</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dispute-resolution">Résolution / Notes</Label>
                  <Textarea
                    id="dispute-resolution"
                    placeholder="Décrivez la résolution ou ajoutez des notes..."
                    value={disputeResolution}
                    onChange={(e) => setDisputeResolution(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateDispute}
              disabled={!disputeNewStatus || actionLoading === selectedDispute?.id}
            >
              {actionLoading === selectedDispute?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;

