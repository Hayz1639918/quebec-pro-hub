import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";

export interface ProjectReport {
  id: string;
  title: string;
  report_type: string;
  content: string;
  progress_percentage: number | null;
  created_at: string;
  is_read_by_client: boolean;
}

interface ProjectReportsTabProps {
  reports: ProjectReport[];
  onMarkAsRead: (reportId: string) => void;
}

/** Onglet « Rapports » de la page projet : rapports d'avancement de l'entrepreneur (US-045). */
export default function ProjectReportsTab({ reports, onMarkAsRead }: ProjectReportsTabProps) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucun rapport disponible pour ce projet.</p>
          <p className="text-sm mt-1">L'entrepreneur partagera les rapports d'avancement ici.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            !report.is_read_by_client ? "bg-blue-50 border-blue-300 shadow-sm" : "hover:bg-muted/30"
          }`}
          onClick={() => {
            if (!report.is_read_by_client) onMarkAsRead(report.id);
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-lg">{report.title}</h4>
                {!report.is_read_by_client && <Badge className="bg-blue-600 text-xs">Nouveau</Badge>}
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                Type: {report.report_type.replace(/_/g, " ")}
              </p>
            </div>
            {report.progress_percentage !== null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Avancement</p>
                <Badge variant="outline" className="text-lg font-bold">
                  {report.progress_percentage}%
                </Badge>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg p-3 border mb-3">
            <p className="text-sm whitespace-pre-wrap">{report.content}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{format(new Date(report.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
            {!report.is_read_by_client && (
              <span className="text-blue-600 font-medium">Cliquez pour marquer comme lu</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
