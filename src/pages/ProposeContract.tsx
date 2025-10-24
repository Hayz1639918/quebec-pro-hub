import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Template = { id: string; name: string; description: string | null; template_content: string; variables?: Record<string, unknown> };
type Project = { id: string; title: string; description: string; client_id: string };

const ProposeContract = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectProject = searchParams.get('project');

  const [userId, setUserId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    project_id: '',
    template_id: '',
    title: '',
    description: '',
    total_amount: '',
    deposit_percentage: '0',
    start_date: '',
    end_date: '',
  });

  const selectedTemplate = useMemo(() => templates.find(t => t.id === form.template_id) || null, [templates, form.template_id]);
  const selectedProject = useMemo(() => projects.find(p => p.id === form.project_id) || null, [projects, form.project_id]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?mode=login'); return; }
      setUserId(session.user.id);
      const { data: prof } = await supabase.from('profiles').select('user_type,is_rbq_verified,full_name,company_name,email').eq('id', session.user.id).single();
      if (prof?.user_type !== 'professional' || !prof?.is_rbq_verified) { navigate('/'); return; }
      await fetchTemplates();
      await fetchProjects(session.user.id);
      setLoading(false);
      if (preselectProject) setForm(f => ({ ...f, project_id: preselectProject }));
    })();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('contract_templates').select('id,name,description,template_content').eq('is_active', true).order('created_at', { ascending: false });
    setTemplates(data || []);
  };

  const fetchProjects = async (uid: string) => {
    // Professional proposes to a client project: list open projects (optionally filter by relevance later)
    const { data } = await supabase.from('projects').select('id,title,description,client_id').eq('status','open').order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const generateContent = (template: Template) => {
    let content = template.template_content;
    const variables: Record<string, string> = {
      project_title: selectedProject?.title || '',
      total_amount: form.total_amount || '0',
      start_date: form.start_date || '',
      end_date: form.end_date || '',
    };
    Object.entries(variables).forEach(([k, v]) => {
      const re = new RegExp(`{{${k}}}`,'g');
      content = content.replace(re, v ?? '');
    });
    return content;
  };

  const submitProposal = async () => {
    if (!userId || !selectedProject || !selectedTemplate) return;
    if (!form.title || !form.total_amount) return;
    const { data: client } = await supabase.from('profiles').select('id').eq('id', selectedProject.client_id).single();
    if (!client) return;
    const draft = generateContent(selectedTemplate);
    const { error } = await supabase.from('contract_proposals').insert({
      project_id: selectedProject.id,
      client_id: client.id,
      professional_id: userId,
      template_id: selectedTemplate.id,
      title: form.title,
      description: form.description || null,
      variables: {
        project_title: selectedProject.title,
        total_amount: form.total_amount,
        start_date: form.start_date,
        end_date: form.end_date,
      },
      contract_content_draft: draft,
      total_amount: Number(form.total_amount),
      currency: 'CAD',
      deposit_percentage: Number(form.deposit_percentage || '0'),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: 'pending',
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
    navigate('/contracts');
  };

  if (loading) return null;

  return (
    <div className='min-h-screen flex flex-col'>
      <Navigation />
      <main className='container mx-auto px-6 lg:px-8 pt-24 pb-12 flex-1'>
        <Card>
          <CardHeader>
            <CardTitle>Proposer un contrat</CardTitle>
            <CardDescription>Sélectionnez un projet et un modèle, puis personnalisez.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Projet</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue placeholder='Sélectionner un projet' /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Modèle</Label>
                <Select value={form.template_id} onValueChange={(v) => setForm(f => ({ ...f, template_id: v }))}>
                  <SelectTrigger><SelectValue placeholder='Sélectionner un modèle' /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Titre</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className='space-y-2'>
                <Label>Montant total (CAD)</Label>
                <Input type='number' value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
              </div>
              <div className='space-y-2'>
                <Label>Acompte (%)</Label>
                <Input type='number' value={form.deposit_percentage} onChange={e => setForm(f => ({ ...f, deposit_percentage: e.target.value }))} />
              </div>
              <div className='space-y-2'>
                <Label>Début</Label>
                <Input type='date' value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className='space-y-2'>
                <Label>Fin</Label>
                <Input type='date' value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className='flex justify-end'>
              <Button onClick={submitProposal} disabled={!form.project_id || !form.template_id || !form.title || !form.total_amount}>Envoyer la proposition</Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProposeContract;
