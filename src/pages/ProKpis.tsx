import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ProKpis = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    proposalsSent: 0,
    proposalsAccepted: 0,
    acceptanceRate: 0,
    averageRating: 0,
    reviewsCount: 0,
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?mode=login'); return; }
      setUserId(session.user.id);
      const { data: prof } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
      if (prof?.user_type !== 'professional') { navigate('/'); return; }
      await fetchKpis(session.user.id);
    })();
  }, []);

  const fetchKpis = async (uid: string) => {
    // proposals
    const { data: proposals } = await supabase.from('proposals').select('status').eq('professional_id', uid);
    const proposalsSent = proposals?.length || 0;
    const proposalsAccepted = proposals?.filter(p => p.status === 'accepted').length || 0;
    const acceptanceRate = proposalsSent ? Math.round((proposalsAccepted / proposalsSent) * 100) : 0;
    // reviews
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('professional_id', uid);
    const reviewsCount = reviews?.length || 0;
    const averageRating = reviewsCount ? Math.round((reviews!.reduce((s, r) => s + (r.rating || 0), 0) / reviewsCount) * 10) / 10 : 0;
    setStats({ proposalsSent, proposalsAccepted, acceptanceRate, averageRating, reviewsCount });
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <Navigation />
      <main className='container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1'>
        <Card>
          <CardHeader>
            <CardTitle>Mes KPIs</CardTitle>
            <CardDescription>Améliorez votre réputation grâce à ces indicateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground'>Taux d'acceptation</div>
                <div className='text-3xl font-bold'>{stats.acceptanceRate}%</div>
                <div className='text-xs text-muted-foreground'>{stats.proposalsAccepted}/{stats.proposalsSent} propositions</div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground'>Satisfaction</div>
                <div className='text-3xl font-bold'>{stats.averageRating}/5</div>
                <div className='text-xs text-muted-foreground'>{stats.reviewsCount} avis</div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground'>Activité récente</div>
                <div className='text-3xl font-bold'>—</div>
                <div className='text-xs text-muted-foreground'>Prochaines versions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProKpis;

