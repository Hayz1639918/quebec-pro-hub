import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  User, 
  Building2,
  Eye,
  Pen,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Contract, ContractStatus, ContractStats } from "@/types/contracts";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ContractTemplates } from "@/components/contracts/ContractTemplates";
import { ContractViewer } from "@/components/contracts/ContractViewer";
import { ContractBuilder } from "@/components/contracts/ContractBuilder";
import { UploadContract } from "@/components/contracts/UploadContract";
import type { ContractTemplate } from "@/types/contracts";
import Navigation from "@/components/Navigation";

const Contracts = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'client' | 'professional' | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("contracts");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"created_at" | "title" | "total_amount">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchContracts();
      fetchStats();
    }
  }, [userId, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const contractId = searchParams.get('contract');
    if (contractId) {
      // First try to find in already loaded contracts
      const contract = contracts.find(c => c.id === contractId);
      if (contract) {
        setSelectedContract(contract);
      } else if (userId) {
        // If not found, fetch it directly
        (async () => {
          try {
            // Simple query first
            const { data, error } = await supabase
              .from('contracts')
              .select('*')
              .eq('id', contractId)
              .single();

            if (error) {
              console.error('Error fetching contract:', error);
              toast({
                variant: "destructive",
                title: t('common.error'),
                description: error.message || t('contracts.error_loading_contract'),
              });
              return;
            }

            if (data) {
              // Fetch related data separately
              let clientName = null;
              let professionalName = null;
              let companyName = null;
              let projectTitle = null;

              if (data.client_id) {
                const { data: clientData } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', data.client_id)
                  .single();
                clientName = clientData?.full_name;
              }

              if (data.professional_id) {
                const { data: proData } = await supabase
                  .from('profiles')
                  .select('full_name, company_name')
                  .eq('id', data.professional_id)
                  .single();
                professionalName = proData?.full_name;
                companyName = proData?.company_name;
              }

              if (data.project_id) {
                const { data: projectData } = await supabase
                  .from('projects')
                  .select('title')
                  .eq('id', data.project_id)
                  .single();
                projectTitle = projectData?.title;
              }

              const transformedContract: Contract = {
                ...data,
                client_name: clientName,
                professional_name: professionalName,
                company_name: companyName,
                project_title: projectTitle,
              };
              setSelectedContract(transformedContract);
              // Also add to contracts list if not already there
              setContracts(prev => {
                if (!prev.find(c => c.id === contractId)) {
                  return [...prev, transformedContract];
                }
                return prev;
              });
            }
          } catch (error: any) {
            console.error('Error fetching contract:', error);
            toast({
              variant: "destructive",
              title: t('common.error'),
              description: error?.message || t('contracts.error_loading_contract'),
            });
          }
        })();
      }
    }
  }, [searchParams, contracts, userId]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      
      // Get user type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.user_type) {
        setUserType(profile.user_type as 'client' | 'professional');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate("/auth");
    }
  };

  const fetchContracts = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      let query = supabase
        .from('contracts')
        .select('*')
        .or(`client_id.eq.${userId},professional_id.eq.${userId}`);

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist yet, silently fail
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Contracts table not yet created. Please apply migration 008_add_contracts_system.sql');
          setContracts([]);
          return;
        }
        throw error;
      }

      // Transform the data - fetch related info for each contract
      const transformedContracts: Contract[] = await Promise.all(
        (data || []).map(async (contract) => {
          let clientName = null;
          let professionalName = null;
          let companyName = null;
          let projectTitle = null;

          // These are optional - don't fail if they can't be fetched
          try {
            if (contract.client_id) {
              const { data: clientData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', contract.client_id)
                .single();
              clientName = clientData?.full_name;
            }
          } catch {}

          try {
            if (contract.professional_id) {
              const { data: proData } = await supabase
                .from('profiles')
                .select('full_name, company_name')
                .eq('id', contract.professional_id)
                .single();
              professionalName = proData?.full_name;
              companyName = proData?.company_name;
            }
          } catch {}

          try {
            if (contract.project_id) {
              const { data: projectData } = await supabase
                .from('projects')
                .select('title')
                .eq('id', contract.project_id)
                .single();
              projectTitle = projectData?.title;
            }
          } catch {}

          return {
            ...contract,
            client_name: clientName,
            professional_name: professionalName,
            company_name: companyName,
            project_title: projectTitle,
          };
        })
      );

      setContracts(transformedContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('contracts.error_loading_contracts'),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('status, total_amount, created_at')
        .or(`client_id.eq.${userId},professional_id.eq.${userId}`);

      if (error) {
        // If table doesn't exist, set empty stats
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          setStats({
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
          return;
        }
        throw error;
      }

      const contracts = data || [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const stats: ContractStats = {
        total_contracts: contracts.length,
        signed_contracts: contracts.filter(c => c.status === 'signed').length,
        pending_signatures: contracts.filter(c => 
          ['pending_client_signature', 'pending_professional_signature', 'pending_both_signatures'].includes(c.status)
        ).length,
        draft_contracts: contracts.filter(c => c.status === 'draft').length,
        expired_contracts: contracts.filter(c => c.status === 'expired').length,
        total_value: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0),
        average_contract_value: contracts.length > 0 
          ? contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0) / contracts.length 
          : 0,
        contracts_this_month: contracts.filter(c => 
          new Date(c.created_at) >= thisMonth
        ).length,
        contracts_last_month: contracts.filter(c => {
          const created = new Date(c.created_at);
          return created >= lastMonth && created < thisMonth;
        }).length,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching contract stats:', error);
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'pending_client_signature':
      case 'pending_professional_signature':
      case 'pending_both_signatures':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending_client_signature':
      case 'pending_professional_signature':
      case 'pending_both_signatures':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return t('contracts.status.signed');
      case 'pending_client_signature':
        return t('contracts.status.pending_client_signature');
      case 'pending_professional_signature':
        return t('contracts.status.pending_professional_signature');
      case 'pending_both_signatures':
        return t('contracts.status.pending_both_signatures');
      case 'draft':
        return t('contracts.status.draft');
      case 'cancelled':
        return t('contracts.status.cancelled');
      case 'expired':
        return t('contracts.status.expired');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('common.not_specified');
    const locale = i18n.language === 'fr' ? fr : enUS;
    return format(new Date(dateString), 'PP', { locale });
  };

  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setSearchParams({ contract: contract.id });
  };

  const handleCreateContract = () => {
    // Show templates tab
    setCurrentTab('templates');
  };

  const handleSelectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setIsBuilding(true);
  };

  const handleCancelBuilder = () => {
    setSelectedTemplate(null);
    setIsBuilding(false);
  };

  const handleContractCreated = async (contractId: string) => {
    // Refresh contracts list
    await fetchContracts();
    await fetchStats();
    
    // Show the created contract
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setSelectedContract(contract);
    }
    
    // Reset builder
    setSelectedTemplate(null);
    setIsBuilding(false);
    setSearchParams({ contract: contractId });
  };

  const handleContractUpdate = (updatedContract: Contract) => {
    setContracts(prev => 
      prev.map(c => c.id === updatedContract.id ? updatedContract : c)
    );
    setSelectedContract(updatedContract);
    fetchStats(); // Refresh stats
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto p-6 max-w-7xl">
          {!isBuilding && !isUploading && !selectedContract && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{t('contracts.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('contracts.subtitle')}</p>
            </div>
          )}

      {isUploading && userId && userType ? (
        <UploadContract
          userId={userId}
          userType={userType}
          onContractUploaded={() => {
            setIsUploading(false);
            fetchContracts();
            toast({
              title: "Contrat ajouté",
              description: "Votre contrat a été uploadé avec succès",
            });
          }}
          onCancel={() => setIsUploading(false)}
        />
      ) : isBuilding && selectedTemplate && userId && userType === 'professional' ? (
        <ContractBuilder
          template={selectedTemplate}
          onCancel={handleCancelBuilder}
          onContractCreated={handleContractCreated}
          userId={userId}
        />
      ) : selectedContract ? (
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => {
              if (userType === 'client') {
                // Clients go back to their dashboard contracts section
                navigate('/dashboard?tab=contracts');
              } else {
                // Professionals stay on the contracts page
                setSelectedContract(null);
                setSearchParams({});
              }
            }}
          >
            ← {userType === 'client' ? 'Retour à mes contrats' : t('contracts.back_to_list')}
          </Button>
          <ContractViewer
            contractId={selectedContract.id}
            onContractUpdate={handleContractUpdate}
            currentUserId={userId}
          />
        </div>
      ) : (
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="contracts">{t('contracts.my_contracts')}</TabsTrigger>
              {userType === 'professional' && (
                <TabsTrigger value="templates">{t('contracts.create_contract')}</TabsTrigger>
              )}
            </TabsList>
            <Button 
              variant="outline" 
              onClick={() => setIsUploading(true)}
              className="ml-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              Uploader un contrat existant
            </Button>
          </div>

          <TabsContent value="contracts" className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('contracts.stats.total_contracts')}</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_contracts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('contracts.stats.signed_contracts')}</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.signed_contracts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('contracts.stats.pending_signatures')}</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending_signatures}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('contracts.stats.total_value')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.total_value)}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('contracts.search_placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContractStatus | "all")}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('contracts.filter_status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('contracts.all_statuses')}</SelectItem>
                      <SelectItem value="signed">{t('contracts.status.signed')}</SelectItem>
                      <SelectItem value="pending_client_signature">{t('contracts.status.pending_client_signature')}</SelectItem>
                      <SelectItem value="pending_professional_signature">{t('contracts.status.pending_professional_signature')}</SelectItem>
                      <SelectItem value="pending_both_signatures">{t('contracts.status.pending_both_signatures')}</SelectItem>
                      <SelectItem value="draft">{t('contracts.status.draft')}</SelectItem>
                      <SelectItem value="cancelled">{t('contracts.status.cancelled')}</SelectItem>
                      <SelectItem value="expired">{t('contracts.status.expired')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as "created_at" | "title" | "total_amount")}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('contracts.sort_by')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">{t('contracts.sort.created_at')}</SelectItem>
                      <SelectItem value="title">{t('contracts.sort.title')}</SelectItem>
                      <SelectItem value="total_amount">{t('contracts.sort.amount')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contracts List */}
            {contracts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">{t('contracts.no_contracts')}</h3>
                  <p className="text-muted-foreground">
                    {t('contracts.no_contracts_hint')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contracts.map((contract) => (
                  <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{contract.title}</h3>
                            <Badge className={getStatusColor(contract.status)}>
                              {getStatusIcon(contract.status)}
                              <span className="ml-1">{getStatusLabel(contract.status)}</span>
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{contract.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t('contracts.client')}:</span>
                              <p className="font-medium">{contract.client_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('contracts.professional')}:</span>
                              <p className="font-medium">{contract.professional_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('contracts.amount')}:</span>
                              <p className="font-medium">{formatCurrency(contract.total_amount, contract.currency)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('contracts.created')}:</span>
                              <p className="font-medium">{formatDate(contract.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewContract(contract)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('contracts.view')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <ContractTemplates
              onSelectTemplate={handleSelectTemplate}
              onCreateCustom={() => {
                toast({
                  title: t('contracts.custom_contract'),
                  description: t('contracts.custom_contract_description'),
                });
              }}
            />
          </TabsContent>
        </Tabs>
      )}
        </div>
      </div>
    </>
  );
};

export default Contracts;
