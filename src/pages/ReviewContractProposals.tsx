import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type PaymentHandling = 'platform' | 'offline';

type Proposal = {
  id: string;
  title: string;
  description: string | null;
  total_amount: number;
  currency: string;
  professional_id: string;
  project_id: string;
  created_at: string;
  payment_handling: PaymentHandling;
};

const handlingBadge = (handling: PaymentHandling) =>
  handling === 'offline'
    ? { label: 'Hors plateforme', tone: 'bg-muted text-foreground border-border', icon: Banknote }
    : { label: 'Via plateforme', tone: 'bg-primary/10 text-primary border-primary/30', icon: Shield };

const ReviewContractProposals = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?mode=login'); return; }
      setUserId(session.user.id);
      const { data: prof } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
      if (prof?.user_type !== 'client') { navigate('/'); return; }
      await fetchProposals(session.user.id);
      setLoading(false);
    })();
  }, [navigate]);

  const fetchProposals = async (uid: string) => {
    const { data, error } = await supabase
      .from('contract_proposals')
      .select('id,title,description,total_amount,currency,professional_id,project_id,created_at,status,payment_handling')
      .eq('client_id', uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!error) setItems((data || []) as Proposal[]);
  };

  const accept = async (id: string) => {
    try {
      const { data: newId, error } = await supabase.rpc('accept_contract_proposal', { proposal_uuid: id });
      if (error) throw error;
      navigate(`/contracts?contract=${newId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const reject = async (id: string) => {
    await supabase
      .from('contract_proposals')
      .update({ status: 'rejected' })
      .eq('id', id)
      .eq('client_id', userId!);
    if (userId) await fetchProposals(userId);
  };

  if (loading) return null;

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <Navigation />
      <main className='container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1 max-w-3xl'>
        <p className="tech-label-blue mb-2">Contrats · Propositions</p>
        <Card className="card-accent">
          <CardHeader>
            <CardTitle>Propositions de contrat</CardTitle>
            <CardDescription>Examinez la modalité de règlement avant d'accepter ou rejeter</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {items.map(p => {
              const handling = handlingBadge(p.payment_handling || 'platform');
              const HandlingIcon = handling.icon;
              return (
                <div key={p.id} className='border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className='font-medium'>{p.title}</span>
                      <Badge className={`${handling.tone} border text-xs`}>
                        <HandlingIcon className="h-3 w-3 mr-1" />
                        {handling.label}
                      </Badge>
                    </div>
                    <div className='text-sm text-muted-foreground'>{p.description || '—'}</div>
                    <div className='text-sm font-semibold'>
                      {p.total_amount?.toLocaleString('fr-CA')} {p.currency || 'CAD'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reçue le {format(new Date(p.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    {p.payment_handling === 'offline' && (
                      <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2">
                        Vous règlerez l'entrepreneur directement (virement, chèque ou comptant).
                      </p>
                    )}
                  </div>
                  <div className='flex gap-2 shrink-0'>
                    <Button variant='outline' onClick={() => reject(p.id)}>Rejeter</Button>
                    <Button onClick={() => accept(p.id)}>Accepter</Button>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className='text-sm text-muted-foreground py-6 text-center'>Aucune proposition en attente.</div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReviewContractProposals;
