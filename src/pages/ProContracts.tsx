import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  Eye,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Contract {
  id: string;
  title: string;
  status: 'draft' | 'pending_client_signature' | 'pending_professional_signature' | 'pending_both_signatures' | 'signed' | 'cancelled' | 'expired';
  total_amount: number;
  deposit_percentage: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  client_name?: string;
  project_title?: string;
}

interface Milestone {
  id: string;
  contract_id: string;
  title: string;
  amount: number;
  due_date: string | null;
  status: 'pending' | 'requested' | 'approved' | 'rejected' | 'paid';
  requested_by: string | null;
  requested_at: string | null;
  validated_at: string | null;
  created_at: string;
}

const ProContracts = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [selectedTab, setSelectedTab] = useState('active');

  const statusConfig = {
    draft: { label: 'Brouillon', variant: 'secondary' as const, icon: Edit },
    pending_client_signature: { label: 'Attente signature client', variant: 'default' as const, icon: Clock },
    pending_professional_signature: { label: 'Attente votre signature', variant: 'default' as const, icon: Clock },
    pending_both_signatures: { label: 'Attente signatures', variant: 'default' as const, icon: Clock },
    signed: { label: 'Signé', variant: 'default' as const, icon: CheckCircle },
    cancelled: { label: 'Annulé', variant: 'destructive' as const, icon: AlertCircle },
    expired: { label: 'Expiré', variant: 'secondary' as const, icon: AlertCircle },
  };

  const milestoneStatusConfig: Record<Milestone['status'], { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-muted-foreground' },
    requested: { label: 'Validation demandée', color: 'bg-warning' },
    approved: { label: 'Approuvé', color: 'bg-success' },
    rejected: { label: 'Rejeté', color: 'bg-destructive' },
    paid: { label: 'Payé', color: 'bg-success' },
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserId(session.user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('user_type, is_rbq_verified')
        .eq('id', session.user.id)
        .single();

      if (prof?.user_type !== 'professional') {
        navigate('/auth?mode=login', { replace: true });
        return;
      }

      if (!prof?.is_rbq_verified) {
        navigate('/pending-verification');
        return;
      }

      await fetchContracts(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchContracts = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          profiles!contracts_client_id_fkey(full_name),
          projects!project_id(title)
        `)
        .eq('professional_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const contractsWithDetails = (data || []).map((c: any) => ({
        ...c,
        client_name: c.profiles?.full_name || 'Client',
        project_title: c.projects?.title || 'Sans titre',
      }));

      setContracts(contractsWithDetails);

      // Fetch milestones for each contract
      for (const contract of contractsWithDetails) {
        await fetchMilestones(contract.id);
      }
    } catch (e) {
      console.error('Error fetching contracts:', e);
    }
  };

  const fetchMilestones = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_milestones')
        .select('*')
        .eq('contract_id', contractId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      setMilestones((prev) => ({
        ...prev,
        [contractId]: data || [],
      }));
    } catch (e) {
      console.error('Error fetching milestones:', e);
    }
  };

  const calculateProgress = (contractMilestones: Milestone[]) => {
    if (!contractMilestones || contractMilestones.length === 0) return 0;
    const completed = contractMilestones.filter((m) => m.status === 'paid').length;
    return (completed / contractMilestones.length) * 100;
  };

  const calculateTotalPaid = (contractMilestones: Milestone[]) => {
    if (!contractMilestones) return 0;
    return contractMilestones
      .filter((m) => m.status === 'paid')
      .reduce((sum, m) => sum + m.amount, 0);
  };

  const calculateTotalPending = (contractMilestones: Milestone[]) => {
    if (!contractMilestones) return 0;
    return contractMilestones
      .filter((m) => m.status !== 'paid')
      .reduce((sum, m) => sum + m.amount, 0);
  };

  const filterContracts = (status: string) => {
    switch (status) {
      case 'active':
        return contracts.filter((c) => c.status === 'signed');
      case 'pending':
        return contracts.filter((c) => ['draft', 'pending_client_signature', 'pending_professional_signature', 'pending_both_signatures'].includes(c.status));
      case 'completed':
        return contracts.filter((c) => ['cancelled', 'expired'].includes(c.status));
      default:
        return contracts;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
          <div>Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  const activeContracts = filterContracts('active');
  const pendingContracts = filterContracts('pending');
  const completedContracts = filterContracts('completed');

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des contrats</h1>
          <p className="text-muted-foreground">
            Suivez vos contrats, jalons de paiement et factures
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contrats actifs</p>
                  <p className="text-3xl font-bold">{activeContracts.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-3xl font-bold">{pendingContracts.length}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Terminés</p>
                  <p className="text-3xl font-bold">{completedContracts.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus totaux</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0)
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active">
              Actifs ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({pendingContracts.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminés ({completedContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeContracts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Aucun contrat actif</p>
                  <p className="text-sm">Vos contrats actifs apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeContracts.map((contract) => {
                  const contractMilestones = milestones[contract.id] || [];
                  const progress = calculateProgress(contractMilestones);
                  const totalPaid = calculateTotalPaid(contractMilestones);
                  const totalPending = calculateTotalPending(contractMilestones);
                  const StatusIcon = statusConfig[contract.status].icon;

                  return (
                    <Card key={contract.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="mb-2">{contract.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{contract.client_name}</span>
                              <span>•</span>
                              <span>{contract.project_title}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusConfig[contract.status].variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[contract.status].label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Contract Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Montant total</p>
                              <p className="font-semibold text-lg">
                                {formatCurrency(contract.total_amount, contract.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Payé</p>
                              <p className="font-semibold text-lg text-success">
                                {formatCurrency(totalPaid, contract.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">En attente</p>
                              <p className="font-semibold text-lg text-warning">
                                {formatCurrency(totalPending, contract.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Dates</p>
                              <p className="font-semibold text-sm">
                                {contract.start_date && contract.end_date
                                  ? `${format(new Date(contract.start_date), 'PP', { locale: fr })} - ${format(new Date(contract.end_date), 'PP', { locale: fr })}`
                                  : 'Non définies'}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          {/* Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Progression des jalons</span>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          {/* Milestones */}
                          {contractMilestones.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="text-sm font-semibold mb-3">
                                  Jalons de paiement ({contractMilestones.length})
                                </h4>
                                <div className="space-y-2">
                                  {contractMilestones.map((milestone) => (
                                    <div
                                      key={milestone.id}
                                      className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <div
                                          className={`h-3 w-3 rounded-full ${
                                            milestoneStatusConfig[milestone.status].color
                                          }`}
                                        />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{milestone.title}</p>
                                          {milestone.due_date && (
                                            <p className="text-xs text-muted-foreground">
                                              Échéance:{' '}
                                              {format(new Date(milestone.due_date), 'PP', {
                                                locale: fr,
                                              })}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="font-semibold">
                                          {formatCurrency(milestone.amount, contract.currency)}
                                        </span>
                                        <Badge variant={milestone.status === 'rejected' ? 'destructive' : 'secondary'}>
                                          {milestoneStatusConfig[milestone.status].label}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/contracts/${contract.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir le contrat
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                /* TODO: Implement download */
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingContracts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Aucun contrat en attente</p>
                  <p className="text-sm">Les contrats en attente de signature apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingContracts.map((contract) => {
                  const StatusIcon = statusConfig[contract.status].icon;
                  return (
                    <Card key={contract.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{contract.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <span>{contract.client_name}</span>
                              <span>•</span>
                              <span>{contract.project_title}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-lg">
                                {formatCurrency(contract.total_amount, contract.currency)}
                              </span>
                              <Badge variant={statusConfig[contract.status].variant}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[contract.status].label}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedContracts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Aucun contrat terminé</p>
                  <p className="text-sm">Vos contrats terminés apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedContracts.map((contract) => {
                  const StatusIcon = statusConfig[contract.status].icon;
                  const contractMilestones = milestones[contract.id] || [];
                  const totalPaid = calculateTotalPaid(contractMilestones);

                  return (
                    <Card key={contract.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{contract.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <span>{contract.client_name}</span>
                              <span>•</span>
                              <span>
                                Terminé le{' '}
                                {format(new Date(contract.created_at), 'PP', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Montant total</p>
                                <p className="font-semibold text-lg">
                                  {formatCurrency(contract.total_amount, contract.currency)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Payé</p>
                                <p className="font-semibold text-lg text-success">
                                  {formatCurrency(totalPaid, contract.currency)}
                                </p>
                              </div>
                              <Badge variant={statusConfig[contract.status].variant}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[contract.status].label}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/contracts/${contract.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                /* TODO: Implement download */
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ProContracts;

