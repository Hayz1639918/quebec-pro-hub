import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Plan = 'free' | 'premium';

const ProSubscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?mode=login'); return; }
      setUserId(session.user.id);
      // ensure professional
      const { data: prof } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
      if (prof?.user_type !== 'professional') { navigate('/'); return; }
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data?.plan) setCurrentPlan(data.plan as Plan);
    })();
  }, []);

  const choosePlan = async (plan: Plan) => {
    if (!userId) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('subscriptions').insert({ user_id: userId, plan, status: 'active', features: plan === 'premium' ? { visibility_boost: true, insights: true } : {} });
      if (error) throw error;
      setCurrentPlan(plan);
      toast({ title: 'Abonnement mis à jour', description: plan === 'premium' ? 'Premium activé.' : 'Plan gratuit activé.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre à jour l'abonnement" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Gratuit</CardTitle>
              <CardDescription>Présence de base sur la marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc pl-5 text-sm">
                <li>Profil public</li>
                <li>Accès aux projets</li>
                <li>Soumission de devis</li>
              </ul>
              {currentPlan === 'free' ? (
                <Badge>Plan actuel</Badge>
              ) : (
                <Button onClick={() => choosePlan('free')} disabled={saving}>Passer au gratuit</Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Plan Premium</CardTitle>
              <CardDescription>Visibilité et statistiques avancées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc pl-5 text-sm">
                <li>Boost de visibilité dans la recherche</li>
                <li>Statistiques de consultation de profil</li>
                <li>Priorité sur les nouvelles opportunités</li>
              </ul>
              {currentPlan === 'premium' ? (
                <Badge>Plan actuel</Badge>
              ) : (
                <Button onClick={() => choosePlan('premium')} disabled={saving}>Activer Premium</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProSubscription;

