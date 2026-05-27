import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, Search, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Dispute {
  id: string;
  contract_id: string;
  opened_by: string;
  category: string;
  description: string;
  status: string;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface DisputesListProps {
  contractId: string;
  userId: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  open: {
    label: "Ouvert",
    variant: "destructive",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  investigating: {
    label: "En cours d'examen",
    variant: "default",
    icon: <Search className="h-3 w-3" />,
  },
  resolved: {
    label: "Résolu",
    variant: "secondary",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  closed: {
    label: "Fermé",
    variant: "outline",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  quality: "Qualité",
  delay: "Retard",
  payment: "Paiement",
  communication: "Communication",
  other: "Autre",
};

export const DisputesList = ({ contractId, userId }: DisputesListProps) => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, [contractId]);

  const fetchDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch {
      // Table may not exist yet
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (disputes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Litiges ({disputes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {disputes.map((dispute, index) => {
          const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
          return (
            <div key={dispute.id}>
              {index > 0 && <Separator className="mb-3" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[dispute.category] || dispute.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2 mt-1">
                    {dispute.description}
                  </p>
                  {dispute.resolution && (
                    <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-muted pl-2">
                      Résolution : {dispute.resolution}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(dispute.created_at), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
