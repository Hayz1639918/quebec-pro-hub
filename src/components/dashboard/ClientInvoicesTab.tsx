import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle2, Download } from "lucide-react";
import type { ClientContract } from "./ClientContractsTab";

export interface MilestoneTransaction {
  id: string;
  title: string;
  contract_title: string;
  contract_id: string;
  project_title: string | null;
  professional_name: string;
  amount: number;
  status: string;
  validated_at: string | null;
  created_at: string;
}

interface ClientInvoicesTabProps {
  contracts: ClientContract[];
  milestones: MilestoneTransaction[];
  onDownloadInvoice: (contract: ClientContract) => void;
}

/** Onglet « Factures » du tableau de bord client : historique des transactions et jalons de paiement. */
export default function ClientInvoicesTab({ contracts, milestones, onDownloadInvoice }: ClientInvoicesTabProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith("fr") ? fr : enUS;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t("dashboard.invoices_tab.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.invoices_tab.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>{t("dashboard.invoices_tab.empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => {
                const fullyPaid = contract.status === "completed";
                const signed = contract.client_signed_at && contract.professional_signed_at;
                return (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contract.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.professional_name}
                        {contract.company_name ? ` — ${contract.company_name}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(contract.created_at), "PPP", { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {contract.total_amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                        </p>
                        <Badge variant={fullyPaid ? "default" : signed ? "secondary" : "outline"} className="text-xs">
                          {fullyPaid
                            ? t("dashboard.invoices_tab.status_completed")
                            : signed
                              ? t("dashboard.invoices_tab.status_in_progress")
                              : t("dashboard.invoices_tab.status_pending")}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onDownloadInvoice(contract)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">{t("dashboard.invoices_tab.download_invoice")}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {t("dashboard.invoices_tab.milestones_title")}
            </CardTitle>
            <CardDescription>{t("dashboard.invoices_tab.milestones_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.contract_title}
                      {m.project_title ? ` — ${m.project_title}` : ""}
                    </p>
                    {m.validated_at && (
                      <p className="text-xs text-green-600 mt-0.5">
                        {t("dashboard.invoices_tab.validated_on", {
                          date: format(new Date(m.validated_at), "PPP", { locale: dateLocale }),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {m.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                    </p>
                    <Badge
                      variant={m.status === "completed" ? "default" : m.status === "requested" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {m.status === "completed"
                        ? t("dashboard.invoices_tab.milestone_paid")
                        : m.status === "requested"
                          ? t("dashboard.invoices_tab.milestone_requested")
                          : t("dashboard.invoices_tab.milestone_pending")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
