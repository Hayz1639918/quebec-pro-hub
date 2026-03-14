import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Task = { id: string; subcontractor_id: string; title: string; description: string | null; due_date: string | null; status: 'todo'|'in_progress'|'done'; visible_to_subcontractor: boolean };

const SubcontractorTasks = () => {
  const navigate = useNavigate();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [subs, setSubs] = useState<Array<{ id: string; full_name: string }>>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<{ subcontractor_id: string; title: string; description: string; due_date: string; status: 'todo'|'in_progress'|'done'; visible_to_subcontractor: 'true'|'false'; }>({ subcontractor_id: '', title: '', description: '', due_date: '', status: 'todo', visible_to_subcontractor: 'true' });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?mode=login'); return; }
      const { data: prof } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
      if (prof?.user_type !== 'professional') { navigate('/'); return; }
      setOwnerId(session.user.id);
      await fetchSubs(session.user.id);
      await fetchTasks(session.user.id);
    })();
  }, []);

  const fetchSubs = async (uid: string) => {
    const { data } = await supabase.from('subcontractors').select('id,full_name').eq('owner_professional_id', uid);
    setSubs(data || []);
  };

  const fetchTasks = async (uid: string) => {
    const { data } = await supabase
      .from('subcontractor_tasks')
      .select('id,subcontractor_id,title,description,due_date,status,visible_to_subcontractor')
      .in('subcontractor_id', (await supabase.from('subcontractors').select('id').eq('owner_professional_id', uid)).data?.map(s => s.id) || []);
    setTasks(data || []);
  };

  const addTask = async () => {
    if (!form.subcontractor_id || !form.title) return;
    await supabase.from('subcontractor_tasks').insert({
      subcontractor_id: form.subcontractor_id,
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      status: form.status,
      visible_to_subcontractor: form.visible_to_subcontractor === 'true'
    });
    setForm({ subcontractor_id: '', title: '', description: '', due_date: '', status: 'todo', visible_to_subcontractor: 'true' });
    if (ownerId) await fetchTasks(ownerId);
  };

  const updateStatus = async (id: string, status: Task['status']) => {
    await supabase.from('subcontractor_tasks').update({ status }).eq('id', id);
    if (ownerId) await fetchTasks(ownerId);
  };

  const toggleVisibility = async (id: string, visible: boolean) => {
    await supabase.from('subcontractor_tasks').update({ visible_to_subcontractor: !visible }).eq('id', id);
    if (ownerId) await fetchTasks(ownerId);
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <Navigation />
      <main className='container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1'>
        <Card>
          <CardHeader>
            <CardTitle>Tâches sous-traitants</CardTitle>
            <CardDescription>Créer, affecter et suivre les tâches</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
              <Select value={form.subcontractor_id} onValueChange={v => setForm({ ...form, subcontractor_id: v })}>
                <SelectTrigger className='w-full'><SelectValue placeholder='Sous-traitant' /></SelectTrigger>
                <SelectContent>
                  {subs.map(s => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input placeholder='Titre' value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Input placeholder='Description' value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Input placeholder='Échéance' type='date' value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              <Button onClick={addTask}>Ajouter</Button>
            </div>
            <div className='space-y-2'>
              {tasks.map(t => (
                <div key={t.id} className='flex items-center justify-between border rounded p-3'>
                  <div>
                    <div className='font-medium'>{t.title}</div>
                    <div className='text-xs text-muted-foreground'>{t.description || '—'}</div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Select value={t.status} onValueChange={(v: 'todo'|'in_progress'|'done') => updateStatus(t.id, v)}>
                      <SelectTrigger className='w-36'><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value='todo'>À faire</SelectItem>
                        <SelectItem value='in_progress'>En cours</SelectItem>
                        <SelectItem value='done'>Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant='outline' onClick={() => toggleVisibility(t.id, t.visible_to_subcontractor)}>
                      {t.visible_to_subcontractor ? 'Masquer' : 'Montrer'}
                    </Button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div className='text-sm text-muted-foreground'>Aucune tâche.</div>}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SubcontractorTasks;
