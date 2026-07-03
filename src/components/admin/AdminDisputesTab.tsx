import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gavel, Eye } from "lucide-react";

export interface AdminDispute {
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

const CATEGORY_LABELS: Record<string, string> = {
  quality: "Qualité",
  delay: "Retard",
  payment: "Paiement",
  communication: "Communication",
  other: "Autre",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open: { label: "Ouvert", className: "bg-destructive/10 text-destructive" },
  investigating: { label: "En examen", className: "bg-primary/10 text-primary" },
  resolved: { label: "Résolu", className: "bg-green-100 text-green-700" },
  closed: { label: "Fermé", className: "bg-muted text-muted-foreground" },
};

interface AdminDisputesTabProps {
  disputes: AdminDispute[];
  onManage: (dispute: AdminDispute) => void;
}

/** Onglet « Litiges » du dashboard admin : liste + accès à la gestion d'un litige (US-091/093). */
export default function AdminDisputesTab({ disputes, onManage }: AdminDisputesTabProps) {
  if (disputes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">Aucun litige</h3>
          <p className="text-muted-foreground">Il n'y a aucun litige enregistré pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Gestion des litiges
        </CardTitle>
        <CardDescription>
          {disputes.filter((d) => d.status === "open").length} ouvert(s),{" "}
          {disputes.filter((d) => d.status === "investigating").length} en examen
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
            const statusCfg = STATUS_LABELS[dispute.status] || STATUS_LABELS.open;
            return (
              <TableRow key={dispute.id}>
                <TableCell>
                  <p className="font-medium text-sm">{dispute.contract_title || "Sans titre"}</p>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{dispute.client_name}</p>
                    <p className="text-muted-foreground">{dispute.professional_name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{CATEGORY_LABELS[dispute.category] || dispute.category}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(dispute.created_at), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <Badge className={statusCfg.className}>{statusCfg.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onManage(dispute)}>
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
  );
}
