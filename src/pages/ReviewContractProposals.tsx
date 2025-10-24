import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Proposal = {
  id: string;
  title: string;
  description: string | null;
  total_amount: number;
  currency: string;
  professional_id: string;
  project_id: string;
  created_at: string;
};

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
  }, []);

  const fetchProposals = async (uid: string) => {
    const { data, error } = await supabase
      .from('contract_proposals')
      .select('id,title,description,total_amount,currency,professional_id,project_id,created_at,status')
      .eq('client_id', uid)
      .eq('status','pending')
      .order('created_at', { ascending: false });
    if (!error) setItems((data || []) as Proposal[]);
  };

  const accept = async (id: string) => {
    try {
      const { data: newId, error } = await supabase.rpc('accept_contract_proposal', { proposal_uuid: id });
      if (error) throw error;
      navigate(`/contracts?contract=${newId}`);
    } catch (e) {
      // eslint-disable-next-line no-console
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
    <div className='min-h-screen flex flex-col'>
      <Navigation />
      <main className='container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1'>
        <Card>
          <CardHeader>
            <CardTitle>Propositions de contrat</CardTitle>
            <CardDescription>Examinez et acceptez ou rejetez les propositions</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {items.map(p => (
              <div key={p.id} className='border rounded p-4 flex items-center justify-between'>
                <div>
                  <div className='font-medium'>{p.title}</div>
                  <div className='text-sm text-muted-foreground'>{p.description || '—'}</div>
                  <div className='text-sm mt-1'>{p.total_amount?.toLocaleString('fr-CA')} {p.currency || 'CAD'}</div>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={() => reject(p.id)}>Rejeter</Button>
                  <Button onClick={() => accept(p.id)}>Accepter</Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className='text-sm text-muted-foreground'>Aucune proposition en attente.</div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReviewContractProposals;
