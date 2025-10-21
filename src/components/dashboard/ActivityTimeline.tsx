import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  User,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "project_created" | "project_updated" | "project_deleted" | "proposal_received" | "contract_signed" | "payment_made" | "review_posted" | "message_sent" | "profile_viewed";
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    projectTitle?: string;
    professionalName?: string;
    amount?: number;
    [key: string]: string | number | boolean | undefined;
  };
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  project_created: <Plus className="h-4 w-4" />,
  project_updated: <Edit className="h-4 w-4" />,
  project_deleted: <Trash2 className="h-4 w-4" />,
  proposal_received: <MessageSquare className="h-4 w-4" />,
  contract_signed: <FileText className="h-4 w-4" />,
  payment_made: <CheckCircle2 className="h-4 w-4" />,
  review_posted: <User className="h-4 w-4" />,
  message_sent: <MessageSquare className="h-4 w-4" />,
  profile_viewed: <Eye className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  project_created: "bg-green-100 text-green-800 border-green-200",
  project_updated: "bg-blue-100 text-blue-800 border-blue-200",
  project_deleted: "bg-red-100 text-red-800 border-red-200",
  proposal_received: "bg-purple-100 text-purple-800 border-purple-200",
  contract_signed: "bg-indigo-100 text-indigo-800 border-indigo-200",
  payment_made: "bg-emerald-100 text-emerald-800 border-emerald-200",
  review_posted: "bg-amber-100 text-amber-800 border-amber-200",
  message_sent: "bg-cyan-100 text-cyan-800 border-cyan-200",
  profile_viewed: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex items-start gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Aucune activité récente</h3>
        <p className="text-muted-foreground">
          Votre historique d'activité apparaîtra ici
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-5 top-5 bottom-5 w-px bg-border hidden md:block" />

      {activities.map((activity, index) => {
        const icon = ACTIVITY_ICONS[activity.type] || <Clock className="h-4 w-4" />;
        const colorClass = ACTIVITY_COLORS[activity.type] || "bg-gray-100 text-gray-800";

        return (
          <Card key={activity.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${colorClass} relative z-10`}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Metadata */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs space-y-1">
                        {activity.metadata.projectTitle && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Projet:</span>
                            <span className="font-medium">{activity.metadata.projectTitle}</span>
                          </div>
                        )}
                        {activity.metadata.professionalName && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Professionnel:</span>
                            <span className="font-medium">{activity.metadata.professionalName}</span>
                          </div>
                        )}
                        {activity.metadata.amount && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Montant:</span>
                            <span className="font-medium">
                              {activity.metadata.amount.toLocaleString()} $
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp (detailed on hover) */}
                  <div className="text-xs text-muted-foreground mt-2">
                    {format(new Date(activity.timestamp), "d MMMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

