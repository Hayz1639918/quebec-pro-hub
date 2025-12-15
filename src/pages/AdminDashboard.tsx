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
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PendingVerification {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  company_name: string;
  rbq_number: string;
  rbq_certification_url: string;
  services_offered: string | null;
  insurance_info: string | null;
  city: string | null;
  region: string | null;
  created_at: string;
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

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Security state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const hasAccess = await verifyAdminAccess();
      
      if (hasAccess) {
        await Promise.all([
          fetchStats(),
          fetchPendingVerifications(),
          fetchAuditLogs()
        ]);
      }
      
      setLoading(false);
    };

    init();
  }, [verifyAdminAccess, fetchStats, fetchPendingVerifications, fetchAuditLogs]);

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
        title: "✓ Licence RBQ vérifiée",
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
      await Promise.all([fetchStats(), fetchPendingVerifications(), fetchAuditLogs()]);
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

  // Filter pending verifications
  const filteredPending = pendingVerifications.filter(p => 
    p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.rbq_number.includes(searchTerm)
  );

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
              fetchAuditLogs();
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
        <Tabs defaultValue="pending" className="space-y-6">
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
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Numéro RBQ</TableHead>
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
                            <p className="font-medium">{pro.company_name}</p>
                            <p className="text-sm text-muted-foreground">{pro.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {pro.rbq_number}
                          </code>
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

          {/* Audit Logs Tab */}
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

              {/* RBQ Info */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informations RBQ
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Numéro RBQ</Label>
                    <p className="font-mono text-lg">{selectedProfessional.rbq_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Certification</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedProfessional.rbq_certification_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir le document
                    </Button>
                  </div>
                </div>
                
                {/* External RBQ verification link */}
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

              {selectedProfessional.insurance_info && (
                <div>
                  <Label className="text-muted-foreground">Assurance</Label>
                  <p className="text-sm">{selectedProfessional.insurance_info}</p>
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
              disabled={actionLoading !== null}
              className="bg-green-600 hover:bg-green-700"
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;

