import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Search,
  Upload,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractTemplates } from "@/components/contracts/ContractTemplates";
import { ContractViewer } from "@/components/contracts/ContractViewer";
import { ContractBuilder } from "@/components/contracts/ContractBuilder";
import { UploadContract } from "@/components/contracts/UploadContract";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import type { Contract, ContractStatus, ContractStats, ContractTemplate } from "@/types/contracts";
import { normalizeContract } from "@/lib/contract-mapper";
import { formatAmount, formatDateLong } from "@/lib/format";

type UserType = "client" | "professional";
type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

const isExpectedEmptyResult = (error: SupabaseLikeError | null | undefined) => {
  if (!error) return false;
  return error.code === "PGRST116" || error.code === "PGRST117" || /0 rows|no rows/i.test(error.message || "");
};

const isMissingTable = (error: SupabaseLikeError | null | undefined) => {
  if (!error) return false;
  return error.code === "42P01" || /does not exist/i.test(error.message || "");
};

const emptyStats = (): ContractStats => ({
  total_contracts: 0,
  signed_contracts: 0,
  pending_signatures: 0,
  draft_contracts: 0,
  expired_contracts: 0,
  total_value: 0,
  average_contract_value: 0,
  contracts_this_month: 0,
  contracts_last_month: 0,
});

const Contracts = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats>(emptyStats());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState("contracts");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"created_at" | "title" | "total_amount">("created_at");

  const enrichContract = async (rawContract: ContractRow): Promise<Contract> => {
    let clientName: string | null = null;
    let professionalName: string | null = null;
    let companyName: string | null = null;
    let projectTitle: string | null = null;

    if (rawContract.client_id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", rawContract.client_id)
        .maybeSingle();
      clientName = data?.full_name || null;
    }

    if (rawContract.professional_id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", rawContract.professional_id)
        .maybeSingle();
      professionalName = data?.full_name || null;
      companyName = data?.company_name || null;
    }

    if (rawContract.project_id) {
      const { data } = await supabase
        .from("projects")
        .select("title")
        .eq("id", rawContract.project_id)
        .maybeSingle();
      projectTitle = data?.title || null;
    }

    return {
      ...normalizeContract(rawContract),
      client_name: clientName,
      professional_name: professionalName,
      company_name: companyName,
      project_title: projectTitle,
    };
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error && !isExpectedEmptyResult(error)) {
      console.error("Unable to load contract user profile", error);
    }
    if (profile?.user_type === "client" || profile?.user_type === "professional") {
      setUserType(profile.user_type);
    }
  };

  const fetchContracts = async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(false);

    try {
      let query = supabase
        .from("contracts")
        .select("*")
        .or(`client_id.eq.${userId},professional_id.eq.${userId}`);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (searchTerm.trim()) {
        const safeTerm = searchTerm.trim().replace(/[,%()]/g, " ");
        query = query.or(`title.ilike.%${safeTerm}%,description.ilike.%${safeTerm}%`);
      }
      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;
      if (error) {
        if (isMissingTable(error) || isExpectedEmptyResult(error)) {
          setContracts([]);
          return;
        }
        throw error;
      }

      const transformed = await Promise.all((data || []).map((contract) => enrichContract(contract)));
      setContracts(transformed);
    } catch (error) {
      console.error("Unable to load contracts", error);
      setContracts([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("status, total_amount, created_at")
        .or(`client_id.eq.${userId},professional_id.eq.${userId}`);

      if (error) {
        if (isMissingTable(error) || isExpectedEmptyResult(error)) {
          setStats(emptyStats());
          return;
        }
        throw error;
      }

      const rows = data || [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const totalValue = rows.reduce((sum, contract) => sum + Number(contract.total_amount || 0), 0);

      setStats({
        total_contracts: rows.length,
        signed_contracts: rows.filter((contract) => contract.status === "signed").length,
        pending_signatures: rows.filter((contract) => ["pending_client_signature", "pending_professional_signature", "pending_both_signatures"].includes(contract.status)).length,
        draft_contracts: rows.filter((contract) => contract.status === "draft").length,
        expired_contracts: rows.filter((contract) => contract.status === "expired").length,
        total_value: totalValue,
        average_contract_value: rows.length ? totalValue / rows.length : 0,
        contracts_this_month: rows.filter((contract) => new Date(contract.created_at) >= thisMonth).length,
        contracts_last_month: rows.filter((contract) => {
          const createdAt = new Date(contract.created_at);
          return createdAt >= lastMonth && createdAt < thisMonth;
        }).length,
      });
    } catch (error) {
      console.error("Unable to load contract stats", error);
      setStats(emptyStats());
    }
  };

  const openContractFromUrl = async (contractId: string) => {
    if (!userId) return;

    const alreadyLoaded = contracts.find((contract) => contract.id === contractId);
    if (alreadyLoaded) {
      setSelectedContract(alreadyLoaded);
      return;
    }

    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .or(`client_id.eq.${userId},professional_id.eq.${userId}`)
      .maybeSingle();

    // A missing/stale contract query parameter is a normal navigation state.
    // Clear it quietly instead of showing a red error to the user.
    if (!data || isExpectedEmptyResult(error)) {
      setSelectedContract(null);
      setSearchParams({}, { replace: true });
      return;
    }

    if (error) {
      console.error("Unable to open contract", error);
      setSelectedContract(null);
      setSearchParams({}, { replace: true });
      return;
    }

    const transformed = await enrichContract(data);
    setSelectedContract(transformed);
    setContracts((previous) => previous.some((contract) => contract.id === transformed.id) ? previous : [transformed, ...previous]);
  };

  useEffect(() => {
    void checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;
    void fetchContracts();
    void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    const contractId = searchParams.get("contract");
    if (contractId && userId) void openContractFromUrl(contractId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, userId, contracts.length]);

  const getStatusColor = (status: ContractStatus) => {
    if (status === "signed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (["pending_client_signature", "pending_professional_signature", "pending_both_signatures"].includes(status)) return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
    if (status === "expired") return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getStatusIcon = (status: ContractStatus) => {
    if (status === "signed") return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (["pending_client_signature", "pending_professional_signature", "pending_both_signatures"].includes(status)) return <Clock className="h-3.5 w-3.5" />;
    if (status === "cancelled") return <XCircle className="h-3.5 w-3.5" />;
    if (status === "expired") return <AlertCircle className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  };

  const getStatusLabel = (status: ContractStatus) => {
    const key = `contracts.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const formatDate = (dateString: string | null) => formatDateLong(dateString, {
    lang: i18n.language,
    fallback: t("common.not_specified"),
    pattern: "PP",
  });

  const formatCurrency = (amount: number, currency = "CAD") => formatAmount(amount, {
    lang: i18n.language,
    currency,
  });

  const handleContractCreated = async (contractId: string) => {
    setSelectedTemplate(null);
    setIsBuilding(false);
    await Promise.all([fetchContracts(), fetchStats()]);
    setSearchParams({ contract: contractId });
  };

  const handleContractUpdate = (updatedContract: Contract) => {
    setContracts((previous) => previous.map((contract) => contract.id === updatedContract.id ? updatedContract : contract));
    setSelectedContract(updatedContract);
    void fetchStats();
  };

  const statCards = useMemo(() => [
    { label: t("contracts.stats.total_contracts"), value: stats.total_contracts, icon: FileText },
    { label: t("contracts.stats.signed_contracts"), value: stats.signed_contracts, icon: CheckCircle2 },
    { label: t("contracts.stats.pending_signatures"), value: stats.pending_signatures, icon: Clock },
    { label: t("contracts.stats.total_value"), value: formatCurrency(stats.total_value), icon: DollarSign },
  ], [stats, t, i18n.language]);

  if (!userId && loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] pt-28 px-4">
        <div className="container mx-auto max-w-7xl space-y-5">
          <Skeleton className="h-28 rounded-3xl" />
          <div className="grid md:grid-cols-4 gap-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-28 rounded-2xl" />)}</div>
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20 sm:pt-24">
        {!isBuilding && !isUploading && !selectedContract && (
          <section className="bn-page-hero border-b border-slate-200/70">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
              <div className="max-w-3xl bn-reveal">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-primary/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary/70 shadow-sm">
                  <FileText className="h-4 w-4" /> Espace contrats
                </div>
                <h1 className="mt-5 font-ui text-3xl sm:text-5xl font-bold tracking-tight text-primary">{t("contracts.title")}</h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">{t("contracts.subtitle")}</p>
              </div>
            </div>
          </section>
        )}

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {isUploading && userType ? (
            <div className="bn-surface">
              <UploadContract
                userId={userId}
                userType={userType}
                onContractUploaded={() => {
                  setIsUploading(false);
                  void Promise.all([fetchContracts(), fetchStats()]);
                  toast({ title: "Contrat ajouté", description: "Le contrat a été ajouté à votre espace." });
                }}
                onCancel={() => setIsUploading(false)}
              />
            </div>
          ) : isBuilding && selectedTemplate && userType === "professional" ? (
            <div className="bn-surface">
              <ContractBuilder
                template={selectedTemplate}
                onCancel={() => { setSelectedTemplate(null); setIsBuilding(false); }}
                onContractCreated={handleContractCreated}
                userId={userId}
              />
            </div>
          ) : selectedContract ? (
            <div className="space-y-5">
              <Button
                variant="outline"
                className="rounded-full bg-white"
                onClick={() => {
                  setSelectedContract(null);
                  setSearchParams({}, { replace: true });
                }}
              >
                ← {t("contracts.back_to_list")}
              </Button>
              <div className="bn-surface p-3 sm:p-5">
                <ContractViewer contractId={selectedContract.id} onContractUpdate={handleContractUpdate} currentUserId={userId} />
              </div>
            </div>
          ) : (
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <TabsList className="rounded-xl bg-white border border-slate-200 shadow-sm h-11 p-1">
                  <TabsTrigger value="contracts" className="rounded-lg">{t("contracts.my_contracts")}</TabsTrigger>
                  {userType === "professional" && <TabsTrigger value="templates" className="rounded-lg">{t("contracts.create_contract")}</TabsTrigger>}
                </TabsList>
                <Button variant="outline" onClick={() => setIsUploading(true)} className="rounded-full bg-white">
                  <Upload className="h-4 w-4 mr-2" /> Uploader un contrat existant
                </Button>
              </div>

              <TabsContent value="contracts" className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map(({ label, value, icon: Icon }, index) => (
                    <Card key={label} className="rounded-[1.25rem] border-slate-200/80 shadow-sm bn-reveal" style={{ animationDelay: `${index * 55}ms` }}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-slate-500">{label}</p>
                          <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
                        </div>
                        <p className="mt-4 text-2xl font-bold tracking-tight text-primary">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="rounded-[1.3rem] border-slate-200/80 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid sm:grid-cols-[1fr_210px_210px] gap-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder={t("contracts.search_placeholder")} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-11 pl-10 rounded-xl" />
                      </div>
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContractStatus | "all")}>
                        <SelectTrigger className="h-11 rounded-xl"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("contracts.all_statuses")}</SelectItem>
                          {(["signed", "pending_client_signature", "pending_professional_signature", "pending_both_signatures", "draft", "cancelled", "expired"] as ContractStatus[]).map((status) => <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">{t("contracts.sort.created_at")}</SelectItem>
                          <SelectItem value="title">{t("contracts.sort.title")}</SelectItem>
                          <SelectItem value="total_amount">{t("contracts.sort.amount")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-36 rounded-[1.3rem]" />)}</div>
                ) : loadError ? (
                  <Card className="rounded-[1.3rem] border-amber-200 bg-amber-50/60">
                    <CardContent className="py-10 text-center">
                      <AlertCircle className="h-9 w-9 mx-auto text-amber-600 mb-3" />
                      <h2 className="font-semibold text-primary">Les contrats ne peuvent pas être chargés pour le moment</h2>
                      <p className="text-sm text-slate-600 mt-2">Votre compte reste accessible. Réessayez simplement le chargement.</p>
                      <Button variant="outline" onClick={() => void fetchContracts()} className="mt-5 rounded-full bg-white">Réessayer</Button>
                    </CardContent>
                  </Card>
                ) : contracts.length === 0 ? (
                  <Card className="rounded-[1.3rem] border-slate-200/80 shadow-sm">
                    <CardContent className="py-12 text-center">
                      <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/8 flex items-center justify-center"><FileText className="h-7 w-7 text-primary/55" /></div>
                      <h2 className="mt-4 text-lg font-semibold text-primary">{t("contracts.no_contracts")}</h2>
                      <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">Aucun contrat n'est associé à votre compte pour le moment. C'est un état normal et non une erreur.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract, index) => (
                      <Card key={contract.id} className="rounded-[1.3rem] border-slate-200/80 shadow-sm bn-card-lift bn-reveal" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                        <CardContent className="p-5 sm:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="font-ui text-lg font-bold text-primary">{contract.title}</h2>
                                <Badge variant="outline" className={`rounded-full gap-1.5 ${getStatusColor(contract.status)}`}>{getStatusIcon(contract.status)}{getStatusLabel(contract.status)}</Badge>
                              </div>
                              {contract.description && <p className="mt-2 text-sm text-slate-600 line-clamp-2">{contract.description}</p>}
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div><span className="text-slate-500">Client</span><p className="font-semibold text-slate-800 mt-0.5 truncate">{contract.client_name || "—"}</p></div>
                                <div><span className="text-slate-500">Professionnel</span><p className="font-semibold text-slate-800 mt-0.5 truncate">{contract.professional_name || contract.company_name || "—"}</p></div>
                                <div><span className="text-slate-500">Montant</span><p className="font-semibold text-slate-800 mt-0.5">{formatCurrency(contract.total_amount, contract.currency)}</p></div>
                                <div><span className="text-slate-500">Créé</span><p className="font-semibold text-slate-800 mt-0.5">{formatDate(contract.created_at)}</p></div>
                              </div>
                            </div>
                            <Button variant="outline" className="rounded-full bg-white shrink-0" onClick={() => { setSelectedContract(contract); setSearchParams({ contract: contract.id }); }}>
                              <Eye className="h-4 w-4 mr-2" /> {t("contracts.view")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="templates">
                <div className="bn-surface">
                  <ContractTemplates
                    onSelectTemplate={(template) => { setSelectedTemplate(template); setIsBuilding(true); }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      {!isBuilding && !isUploading && !selectedContract && <Footer />}
    </div>
  );
};

export default Contracts;
