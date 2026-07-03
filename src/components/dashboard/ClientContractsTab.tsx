import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Eye } from "lucide-react";

export interface ClientContract {
  id: string;
  title: string;
  project_title: string | null;
  project_id: string | null;
  professional_name: string;
  company_name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  client_signed_at: string | null;
  professional_signed_at: string | null;
}

interface ClientContractsTabProps {
  contracts: ClientContract[];
}

/** Onglet « Contrats » du tableau de bord client : liste des contrats reçus avec statut de signature. */
export default function ClientContractsTab({ contracts }: ClientContractsTabProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith("fr") ? fr : enUS;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("dashboard.contracts.title")}</CardTitle>
            <CardDescription>{t("dashboard.contracts_tab.description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">{t("dashboard.contracts_tab.empty_title")}</h3>
            <p className="text-muted-foreground mb-4">{t("dashboard.contracts_tab.empty_description")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const isFullySigned = contract.client_signed_at && contract.professional_signed_at;
              const needsClientSignature = !contract.client_signed_at;
              const needsProSignature = !contract.professional_signed_at;

              return (
                <div
                  key={contract.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    needsClientSignature
                      ? "bg-warning-light border-warning/30"
                      : isFullySigned
                        ? "bg-success-light border-success/30"
                        : "bg-white"
                  }`}
                  onClick={() => navigate(`/contracts?contract=${contract.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{contract.title}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {contract.project_title && (
                          <p>{t("dashboard.contracts_tab.project_label", { title: contract.project_title })}</p>
                        )}
                        <p>{t("dashboard.contracts_tab.from_label", { name: contract.company_name || contract.professional_name })}</p>
                        <p className="font-medium text-foreground">
                          {contract.total_amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {needsClientSignature ? (
                        <Badge className="bg-warning">{t("dashboard.contracts_tab.to_sign")}</Badge>
                      ) : isFullySigned ? (
                        <Badge className="bg-success inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("dashboard.contracts_tab.signed")}
                        </Badge>
                      ) : needsProSignature ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          {t("dashboard.contracts_tab.awaiting_pro_signature")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{contract.status}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {t("dashboard.contracts_tab.received_on", {
                        date: format(new Date(contract.created_at), "dd MMM yyyy", { locale: dateLocale }),
                      })}
                    </span>
                    {needsClientSignature && (
                      <Button size="sm" className="bg-warning hover:bg-warning/90 text-warning-foreground">
                        {t("dashboard.contracts_tab.view_and_sign")}
                      </Button>
                    )}
                    {isFullySigned && (
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        {t("dashboard.contracts_tab.view_contract")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
