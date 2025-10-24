import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Subcontractor { id: string; full_name: string; email: string; status: string; }

const Subcontractors = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?mode=login'); return; }
      setUserId(session.user.id);
      const { data: prof } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
      if (prof?.user_type !== 'professional') { navigate('/'); return; }
      await fetchSubs(session.user.id);
    })();
  }, []);

  const fetchSubs = async (uid: string) => {
    const { data } = await supabase.from('subcontractors').select('*').eq('owner_professional_id', uid);
    setSubs(data || []);
  };

  const invite = async () => {
    if (!userId || !name || !email) return;
    const { error } = await supabase.from('subcontractors').insert({ owner_professional_id: userId, full_name: name, email });
    if (!error) {
      setName(''); setEmail('');
      await fetchSubs(userId);
    }
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <Navigation />
      <main className='container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1'>
        <Card>
          <CardHeader>
            <CardTitle>Mes sous-traitants</CardTitle>
            <CardDescription>Invitez et gérez vos sous-traitants</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <Input placeholder='Nom complet' value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder='Email' type='email' value={email} onChange={e => setEmail(e.target.value)} />
              <Button onClick={invite}>Inviter</Button>
            </div>
            <div className='space-y-2'>
              {subs.map(s => (
                <div key={s.id} className='flex items-center justify-between border rounded p-3'>
                  <div>
                    <div className='font-medium'>{s.full_name}</div>
                    <div className='text-sm text-muted-foreground'>{s.email} · {s.status}</div>
                  </div>
                </div>
              ))}
              {subs.length === 0 && (
                <div className='text-sm text-muted-foreground'>Aucun sous-traitant pour le moment.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Subcontractors;

