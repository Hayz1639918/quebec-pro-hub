import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  DollarSign,
  Eye,
  MessageSquare,
  MoreVertical,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Proposal {
  id: string;
  project_id: string;
  professional_id: string;
  message: string;
  estimated_budget: number | null;
  estimated_duration_days: number | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  proposal_number?: string;
  professional?: {
    full_name: string;
    company_name?: string;
  };
  project?: {
    title: string;
  };
}

interface ProposalsListProps {
  proposals: Proposal[];
  onStatusUpdate?: () => void;
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending: "dashboard.proposals_list.status_pending",
  accepted: "dashboard.proposals_list.status_accepted",
  rejected: "dashboard.proposals_list.status_rejected",
  withdrawn: "dashboard.proposals_list.status_withdrawn",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
};

const STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  accepted: CheckCircle2,
  rejected: XCircle,
  withdrawn: XCircle,
};

export default function ProposalsList({ proposals, onStatusUpdate }: ProposalsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<{ id: string; action: "accept" | "reject" } | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleActionClick = (proposalId: string, action: "accept" | "reject") => {
    setSelectedProposal({ id: proposalId, action });
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProposal) return;

    setProcessing(true);
    const proposal = proposals.find(p => p.id === selectedProposal.id);
    
    
    try {
      if (selectedProposal.action === "reject") {
        // REFUSER: Utiliser la fonction SQL sécurisée
        const { data, error } = await supabase.rpc("reject_proposal", {
          proposal_uuid: selectedProposal.id
        });

        
        if (error) {
          console.error("Erreur détaillée:", error);
          throw new Error(error.message || t("dashboard.proposals_list.reject_error"));
        }

        toast.success(t("dashboard.proposals_list.rejected_toast"));
      } else {
        // ACCEPTER: Utiliser la fonction SQL sécurisée
        const { data, error } = await supabase.rpc("accept_proposal", {
          proposal_uuid: selectedProposal.id
        });

        
        if (error) {
          console.error("Erreur détaillée:", error);
          throw new Error(error.message || t("dashboard.proposals_list.accept_error"));
        }

        toast.success(t("dashboard.proposals_list.accepted_toast"), {
          description: t("dashboard.proposals_list.accepted_toast_description"),
        });
      }

      // Fermer la boîte de dialogue
      setActionDialogOpen(false);
      setSelectedProposal(null);
      
      // Rafraîchir les données via le callback
      if (onStatusUpdate) {
        onStatusUpdate();
      }
      
      // Rediriger vers l'onglet projets après acceptation
      if (selectedProposal.action === "accept") {
        setTimeout(() => {
          navigate("/dashboard?tab=projects");
        }, 1000);
      } else {
        // Rafraîchir après un court délai pour le refus
        setTimeout(() => {
          if (onStatusUpdate) onStatusUpdate();
        }, 500);
      }
    } catch (error: unknown) {
      console.error("Error updating proposal:", error);
      const errorMessage = error instanceof Error ? error.message : t("dashboard.proposals_list.unknown_error");
      toast.error(t("dashboard.proposals_list.update_error"), { 
        description: errorMessage 
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return t("dashboard.proposals_list.not_specified");
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t("dashboard.proposals_list.empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Desktop View - Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboard.proposals_list.col_professional")}</TableHead>
                <TableHead>{t("dashboard.proposals_list.col_project")}</TableHead>
                <TableHead>{t("dashboard.proposals_list.col_budget")}</TableHead>
                <TableHead>{t("dashboard.proposals_list.col_duration")}</TableHead>
                <TableHead>{t("dashboard.proposals_list.col_status")}</TableHead>
                <TableHead>{t("dashboard.proposals_list.col_date")}</TableHead>
                <TableHead className="text-right">{t("dashboard.proposals_list.col_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => {
                const StatusIcon = STATUS_ICONS[proposal.status];
                return (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {proposal.professional?.company_name || proposal.professional?.full_name}
                        </div>
                        {proposal.proposal_number && (
                          <div className="text-xs text-muted-foreground">{proposal.proposal_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{proposal.project?.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatCurrency(proposal.estimated_budget)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {t("dashboard.proposals_list.days", { count: proposal.estimated_duration_days ?? 0 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[proposal.status]} variant="outline">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {t(STATUS_LABEL_KEYS[proposal.status])}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(proposal.created_at), "d MMM yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("dashboard.proposals_list.col_actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/proposal/${proposal.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/proposal/${proposal.id}?showPDF=true`)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Voir le PDF
                          </DropdownMenuItem>
                          {proposal.status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleActionClick(proposal.id, "accept")}
                                className="text-green-600 focus:text-green-600"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Accepter
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleActionClick(proposal.id, "reject")}
                                className="text-red-600 focus:text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Refuser
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          {proposals.map((proposal) => {
            const StatusIcon = STATUS_ICONS[proposal.status];
            return (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {proposal.professional?.company_name || proposal.professional?.full_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {proposal.project?.title}
                      </CardDescription>
                      {proposal.proposal_number && (
                        <p className="text-xs text-muted-foreground mt-1">{proposal.proposal_number}</p>
                      )}
                    </div>
                    <Badge className={STATUS_COLORS[proposal.status]} variant="outline">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {t(STATUS_LABEL_KEYS[proposal.status])}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">{t("dashboard.proposals_list.budget")}</div>
                        <div className="font-medium">
                          {formatCurrency(proposal.estimated_budget)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">{t("dashboard.proposals_list.duration")}</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t("dashboard.proposals_list.days", { count: proposal.estimated_duration_days ?? 0 })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                      <span>{format(new Date(proposal.created_at), "d MMM yyyy", { locale: fr })}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/proposal/${proposal.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/proposal/${proposal.id}?showPDF=true`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      {proposal.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleActionClick(proposal.id, "accept")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleActionClick(proposal.id, "reject")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedProposal?.action === "accept" ? t("dashboard.proposals_list.confirm_accept_title") : t("dashboard.proposals_list.confirm_reject_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProposal?.action === "accept"
                ? t("dashboard.proposals_list.confirm_accept_description")
                : t("dashboard.proposals_list.confirm_reject_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>{t("dashboard.proposals_list.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={processing}
              className={
                selectedProposal?.action === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {processing ? t("dashboard.proposals_list.processing") : selectedProposal?.action === "accept" ? t("dashboard.proposals_list.accept") : t("dashboard.proposals_list.reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

