import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, AlertTriangle, MessageSquare, TrendingUp, CheckCircle, XCircle, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Review {
  id: string;
  project_id: string;
  client_id: string;
  professional_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  project_title?: string;
}

interface Mediation {
  id: string;
  review_id: string;
  professional_id: string;
  reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
  review?: Review;
}

const ProReviews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mediations, setMediations] = useState<Mediation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [mediationReason, setMediationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // US-066 — Reply to reviews
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [savedReplies, setSavedReplies] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [savingReply, setSavingReply] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0,
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserId(session.user.id);

      // Ensure professional
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (prof?.user_type !== 'professional') {
        navigate('/');
        return;
      }

      await fetchReviews(session.user.id);
      await fetchMediations(session.user.id);
      await fetchReplies(session.user.id);
      setLoading(false);
    })();
  }, []);

  const fetchReviews = async (uid: string) => {
    try {
      // Fetch reviews with client info
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_client_id_fkey(full_name),
          projects(title)
        `)
        .eq('professional_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsWithDetails = (data || []).map((r: any) => ({
        ...r,
        client_name: r.profiles?.full_name || 'Client',
        project_title: r.projects?.title || 'Projet sans titre',
      }));

      setReviews(reviewsWithDetails);
      calculateStats(reviewsWithDetails);
    } catch (e) {
      console.error('Error fetching reviews:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les évaluations',
      });
    }
  };

  const fetchMediations = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('mediations')
        .select(`
          *,
          reviews(*)
        `)
        .eq('professional_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMediations((data || []) as Mediation[]);
    } catch (e) {
      console.error('Error fetching mediations:', e);
    }
  };

  const calculateStats = (reviewsList: Review[]) => {
    const total = reviewsList.length;
    if (total === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
      });
      return;
    }

    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / total;

    const fiveStars = reviewsList.filter((r) => r.rating === 5).length;
    const fourStars = reviewsList.filter((r) => r.rating === 4).length;
    const threeStars = reviewsList.filter((r) => r.rating === 3).length;
    const twoStars = reviewsList.filter((r) => r.rating === 2).length;
    const oneStar = reviewsList.filter((r) => r.rating === 1).length;

    setStats({
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
      fiveStars,
      fourStars,
      threeStars,
      twoStars,
      oneStar,
    });
  };

  const submitMediation = async () => {
    if (!userId || !selectedReview || !mediationReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez fournir une raison pour la médiation',
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('mediations').insert({
        review_id: selectedReview.id,
        professional_id: userId,
        reason: mediationReason.trim(),
        status: 'open',
      });

      if (error) throw error;

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de médiation a été soumise. Un administrateur la traitera sous peu.',
      });

      setDialogOpen(false);
      setMediationReason('');
      setSelectedReview(null);

      if (userId) await fetchMediations(userId);
    } catch (e) {
      console.error('Error submitting mediation:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de soumettre la demande de médiation',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Load existing replies from review_replies table
  const fetchReplies = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('review_replies')
        .select('review_id, content')
        .eq('author_id', uid);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: { review_id: string; content: string }) => {
        map[r.review_id] = r.content;
      });
      setSavedReplies(map);
    } catch (e) {
      console.error('Error fetching replies:', e);
    }
  };

  // US-066 — Submit reply to a review (persisted in review_replies table)
  const submitReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text || !userId) return;
    setSavingReply(reviewId);
    try {
      const { error } = await supabase
        .from('review_replies')
        .upsert(
          { review_id: reviewId, author_id: userId, content: text },
          { onConflict: 'review_id' }
        );
      if (error) throw error;
      setSavedReplies(prev => ({ ...prev, [reviewId]: text }));
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      setReplyOpen(prev => ({ ...prev, [reviewId]: false }));
      toast({ title: 'Réponse publiée', description: 'Votre réponse est maintenant visible sur votre profil public.' });
    } catch (e) {
      console.error('Error saving reply:', e);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de publier la réponse' });
    } finally {
      setSavingReply(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getMediationStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Ouverte', variant: 'default' as const },
      in_review: { label: 'En révision', variant: 'secondary' as const },
      resolved: { label: 'Résolue', variant: 'default' as const },
      rejected: { label: 'Rejetée', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mes évaluations</h1>
          <p className="text-muted-foreground">
            Consultez vos évaluations clients et gérez les litiges
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
              {renderStars(Math.round(stats.averageRating))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold">{stats.totalReviews}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Évaluations reçues</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>5 étoiles</span>
                  <span className="font-semibold">{stats.fiveStars}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>4 étoiles</span>
                  <span className="font-semibold">{stats.fourStars}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>3 étoiles</span>
                  <span className="font-semibold">{stats.threeStars}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>2 étoiles</span>
                  <span className="font-semibold">{stats.twoStars}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>1 étoile</span>
                  <span className="font-semibold">{stats.oneStar}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <span>Médiations</span>
                  <span className="font-semibold">{mediations.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Toutes les évaluations</CardTitle>
            <CardDescription>Historique complet de vos évaluations clients</CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Aucune évaluation</p>
                <p className="text-sm">Vos évaluations clients apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(review.created_at), 'PPP', { locale: fr })}
                            </span>
                          </div>
                          <p className="font-semibold">{review.client_name}</p>
                          <p className="text-sm text-muted-foreground">{review.project_title}</p>
                        </div>
                        {review.rating <= 2 && (
                          <Dialog open={dialogOpen && selectedReview?.id === review.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) {
                              setSelectedReview(null);
                              setMediationReason('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReview(review)}
                                disabled={mediations.some((m) => m.review_id === review.id)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {mediations.some((m) => m.review_id === review.id)
                                  ? 'Médiation en cours'
                                  : 'Contester'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Demander une médiation</DialogTitle>
                                <DialogDescription>
                                  Expliquez pourquoi vous souhaitez contester cette évaluation. Un
                                  administrateur examinera votre demande.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-semibold mb-1">Évaluation concernée :</p>
                                  <div className="flex items-center gap-2">
                                    {renderStars(review.rating)}
                                    <span className="text-sm text-muted-foreground">
                                      par {review.client_name}
                                    </span>
                                  </div>
                                  {review.comment && (
                                    <p className="text-sm text-muted-foreground mt-2 italic">
                                      "{review.comment}"
                                    </p>
                                  )}
                                </div>
                                <Separator />
                                <div>
                                  <label className="text-sm font-semibold mb-2 block">
                                    Raison de la contestation *
                                  </label>
                                  <Textarea
                                    placeholder="Expliquez en détail pourquoi cette évaluation est injuste ou inexacte..."
                                    value={mediationReason}
                                    onChange={(e) => setMediationReason(e.target.value)}
                                    rows={5}
                                    className="resize-none"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Minimum 50 caractères
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setDialogOpen(false);
                                    setSelectedReview(null);
                                    setMediationReason('');
                                  }}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  onClick={submitMediation}
                                  disabled={submitting || mediationReason.length < 50}
                                >
                                  {submitting ? 'Envoi...' : 'Soumettre la demande'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground italic mt-2">"{review.comment}"</p>
                      )}

                      {/* US-066 — Reply section */}
                      <Separator className="mt-4 mb-3" />
                      {savedReplies[review.id] ? (
                        <div className="pl-3 border-l-2 border-primary/30">
                          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
                            <Reply className="h-3 w-3" />
                            Votre réponse (visible publiquement)
                          </div>
                          <p className="text-sm text-muted-foreground">{savedReplies[review.id]}</p>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline mt-1"
                            onClick={() => {
                              setReplyText(prev => ({ ...prev, [review.id]: savedReplies[review.id] }));
                              setSavedReplies(prev => { const n = {...prev}; delete n[review.id]; return n; });
                              setReplyOpen(prev => ({ ...prev, [review.id]: true }));
                            }}
                          >
                            Modifier la réponse
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                            onClick={() => setReplyOpen(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                          >
                            <Reply className="h-4 w-4" />
                            Répondre à cet avis
                            {replyOpen[review.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                          {replyOpen[review.id] && (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                placeholder="Rédigez une réponse professionnelle et courtoise... Elle sera visible publiquement sur votre profil."
                                rows={3}
                                value={replyText[review.id] || ''}
                                onChange={e => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" onClick={() => setReplyOpen(prev => ({ ...prev, [review.id]: false }))}>
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => submitReply(review.id)}
                                  disabled={savingReply === review.id || !replyText[review.id]?.trim()}
                                >
                                  {savingReply === review.id ? 'Publication...' : 'Publier la réponse'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mediations */}
        {mediations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mes médiations</CardTitle>
              <CardDescription>Suivi de vos demandes de médiation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mediations.map((mediation) => (
                  <Card key={mediation.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getMediationStatusBadge(mediation.status)}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(mediation.created_at), 'PPP', { locale: fr })}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mb-2">Raison :</p>
                          <p className="text-sm text-muted-foreground">{mediation.reason}</p>
                        </div>
                        {mediation.status === 'resolved' && (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                        {mediation.status === 'rejected' && (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProReviews;

