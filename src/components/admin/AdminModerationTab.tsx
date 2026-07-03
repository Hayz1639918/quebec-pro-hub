import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, MessageSquare } from "lucide-react";

export interface ReviewReport {
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

export interface UserReport {
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

type ModerationTable = "review_reports" | "user_reports";
type ModerationStatus = "resolved" | "dismissed";

interface AdminModerationTabProps {
  reviewReports: ReviewReport[];
  userReports: UserReport[];
  actionLoading: string | null;
  onModerationStatus: (table: ModerationTable, id: string, status: ModerationStatus) => void;
}

function statusBadgeClass(status: string) {
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "resolved") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-700";
}

function ModerationActions({
  id,
  table,
  actionLoading,
  onModerationStatus,
}: {
  id: string;
  table: ModerationTable;
  actionLoading: string | null;
  onModerationStatus: AdminModerationTabProps["onModerationStatus"];
}) {
  return (
    <div className="flex gap-2 shrink-0">
      <Button
        size="sm"
        variant="outline"
        disabled={actionLoading === id}
        onClick={() => onModerationStatus(table, id, "dismissed")}
      >
        Rejeter
      </Button>
      <Button size="sm" disabled={actionLoading === id} onClick={() => onModerationStatus(table, id, "resolved")}>
        Résoudre
      </Button>
    </div>
  );
}

/** Onglet « Modération » du dashboard admin : avis signalés (US-040/095) et utilisateurs signalés (US-029). */
export default function AdminModerationTab({
  reviewReports,
  userReports,
  actionLoading,
  onModerationStatus,
}: AdminModerationTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-5 w-5 text-destructive" />
            Avis signalés ({reviewReports.filter((r) => r.status === "pending").length} en attente)
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
                        <Badge className={statusBadgeClass(r.status)}>{r.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          par {r.reporter_name} · {format(new Date(r.created_at), "dd MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      {r.detail && <p className="text-sm mt-1">{r.detail}</p>}
                      {r.review_comment && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Avis ({r.review_rating}/5) : « {r.review_comment} »
                        </p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <ModerationActions
                        id={r.id}
                        table="review_reports"
                        actionLoading={actionLoading}
                        onModerationStatus={onModerationStatus}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-destructive" />
            Utilisateurs signalés ({userReports.filter((r) => r.status === "pending").length} en attente)
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
                        <Badge className={statusBadgeClass(r.status)}>{r.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "dd MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        <strong>{r.reporter_name}</strong> a signalé <strong>{r.reported_name}</strong>
                      </p>
                      {r.detail && <p className="text-xs text-muted-foreground mt-1">{r.detail}</p>}
                    </div>
                    {r.status === "pending" && (
                      <ModerationActions
                        id={r.id}
                        table="user_reports"
                        actionLoading={actionLoading}
                        onModerationStatus={onModerationStatus}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
