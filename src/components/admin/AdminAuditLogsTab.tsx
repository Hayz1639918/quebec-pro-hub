import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export interface AuditLog {
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

interface AdminAuditLogsTabProps {
  logs: AuditLog[];
}

/** Onglet « Journal » du dashboard admin : historique des actions administratives (audit trail). */
export default function AdminAuditLogsTab({ logs }: AdminAuditLogsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Journal des actions administratives</CardTitle>
        <CardDescription>Historique des 50 dernières actions</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucune action enregistrée.</p>
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
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>{log.admin_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={log.action === "VERIFY_RBQ" ? "default" : "destructive"}
                      className={log.action === "VERIFY_RBQ" ? "bg-green-600" : ""}
                    >
                      {log.action === "VERIFY_RBQ" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Vérification
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" /> Refus
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.new_values && typeof log.new_values === "object" && "notes" in log.new_values
                      ? String(log.new_values.notes)
                      : log.new_values &&
                          typeof log.new_values === "object" &&
                          "rbq_rejection_reason" in log.new_values
                        ? String(log.new_values.rbq_rejection_reason)
                        : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
