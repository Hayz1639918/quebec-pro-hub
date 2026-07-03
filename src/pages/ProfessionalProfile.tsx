import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/supabase/untyped';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Phone,
  Mail,
  Building2,
  Star,
  Award,
  CheckCircle,
  MessageSquare,
  Briefcase,
  FileText,
  Shield,
  Calendar,
  ArrowLeft,
  Flag,
  Share2,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import InviteProfessionalDialog from '@/components/invitations/InviteProfessionalDialog';

interface ProfessionalProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  rbq_number: string | null;
  rbq_certification_url: string | null;
  services_offered: string | null;
  insurance_info: string | null;
  is_rbq_verified: boolean;
  created_at: string;
  bio?: string | null;
  city?: string;
  region?: string;
  profile_picture_url?: string | null;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_date: string | null;
  category: string | null;
}

interface Review {
  id: string;
  client_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  quality_rating?: number | null;
  punctuality_rating?: number | null;
  communication_rating?: number | null;
  value_rating?: number | null;
  client_name?: string;
  project_title?: string;
  pro_reply?: { content: string; created_at: string } | null;
}

const REVIEW_CRITERIA: { key: keyof Review; label: string }[] = [
  { key: "quality_rating", label: "Qualité" },
  { key: "punctuality_rating", label: "Ponctualité" },
  { key: "communication_rating", label: "Communication" },
  { key: "value_rating", label: "Rapport qualité-prix" },
];

interface PublicCertification {
  id: string;
  cert_type: string;
  cert_name: string;
  cert_number: string | null;
  issuer: string | null;
  issued_at: string | null;
  expires_at: string | null;
  certificate_url: string | null;
}

const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    proposalsCount: 0,
    acceptedProposals: 0,
    averageRating: 0,
    reviewsCount: 0,
  });

  // Portfolio
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  // Public certifications (US-050)
  const [certifications, setCertifications] = useState<PublicCertification[]>([]);

  // Reviews (US-040) + replies (US-066)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState('offensive');
  const [reportDetail, setReportDetail] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Invite flow (client -> pro)
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchProfile();
    fetchStats();
    fetchReviews();
    fetchPortfolio();
    fetchCertifications();
  }, [id]);

  const [currentUserType, setCurrentUserType] = useState<'client' | 'professional' | null>(null);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      if (prof?.user_type) {
        setCurrentUserType(prof.user_type as 'client' | 'professional');
      }
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('user_type', 'professional')
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Professionnel introuvable');
        navigate('/professionals');
        return;
      }

      setProfile(data);
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
      navigate('/professionals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Count proposals
      const { count: proposalsCount } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', id);

      // Count accepted proposals
      const { count: acceptedCount } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', id)
        .eq('status', 'accepted');

      // Fetch reviews for real stats
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('professional_id', id);

      const reviewsCount = reviewsData?.length || 0;
      const avgRating = reviewsCount > 0
        ? (reviewsData!.reduce((sum, r) => sum + r.rating, 0) / reviewsCount)
        : 0;

      setStats({
        proposalsCount: proposalsCount || 0,
        acceptedProposals: acceptedCount || 0,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewsCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('id, client_id, rating, comment, created_at, project_id, quality_rating, punctuality_rating, communication_rating, value_rating')
        .eq('professional_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data && data.length > 0) {
        const reviewIds = data.map((r) => r.id);
        const clientIds = Array.from(new Set(data.map((r) => r.client_id)));
        const projectIds = Array.from(
          new Set(data.map((r) => r.project_id).filter(Boolean))
        );

        const [clientsRes, repliesRes, projectsRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', clientIds),
          db
            .from('review_replies')
            .select('review_id, content, created_at')
            .in('review_id', reviewIds),
          projectIds.length > 0
            ? supabase.from('projects').select('id, title').in('id', projectIds)
            : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        ]);

        const clientMap = new Map<string, string>();
        (clientsRes.data || []).forEach((c) =>
          clientMap.set(c.id, c.full_name || 'Client anonyme')
        );
        const replyMap = new Map<string, { content: string; created_at: string }>();
        (repliesRes.data || []).forEach((r) =>
          replyMap.set(r.review_id, { content: r.content, created_at: r.created_at })
        );
        const projectMap = new Map<string, string>();
        ((projectsRes as { data: { id: string; title: string }[] | null }).data || []).forEach((p) =>
          projectMap.set(p.id, p.title)
        );

        const enriched: Review[] = (data as unknown as Review[]).map((r) => ({
          ...r,
          client_name: clientMap.get(r.client_id) || 'Client anonyme',
          project_title: r.project_id ? projectMap.get(r.project_id) : undefined,
          pro_reply: replyMap.get(r.id) || null,
        }));
        setReviews(enriched);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchCertifications = async () => {
    try {
      const { data } = await db
        .from('professional_certifications')
        .select(
          'id, cert_type, cert_name, cert_number, issuer, issued_at, expires_at, certificate_url'
        )
        .eq('professional_id', id)
        .order('issued_at', { ascending: false });
      if (data) setCertifications(data as PublicCertification[]);
    } catch (error) {
      console.error('Error fetching certifications:', error);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const { data } = await supabase
        .from('portfolio_items')
        .select('id, title, description, image_url, project_date, category')
        .eq('professional_id', id)
        .order('project_date', { ascending: false });
      if (data) setPortfolioItems(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const handleReportReview = async () => {
    if (!reportingReview || !currentUserId) return;
    setSubmittingReport(true);
    try {
      const { error } = await db.from('review_reports').insert({
        review_id: reportingReview.id,
        reporter_id: currentUserId,
        reason: reportReason,
        detail: reportDetail.trim() || null,
      });
      if (error) {
        if (error.code === '23505') {
          toast.info('Vous avez déjà signalé cet avis. Notre équipe l\'examine.');
        } else {
          throw error;
        }
      } else {
        toast.success('Avis signalé. Notre équipe de modération va l\'examiner.');
      }
      setReportDialogOpen(false);
      setReportDetail('');
    } catch {
      toast.error('Erreur lors du signalement');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/professional/${id}`;
    const shareData = {
      title: profile?.company_name || profile?.full_name || 'Profil professionnel',
      text: `Découvrez le profil de ${profile?.full_name ?? 'ce professionnel'} sur BâtirNet`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // User cancelled the native share sheet — fall through to clipboard copy
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien du profil copié dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const handleContact = async () => {
    if (!currentUserId) {
      toast.error('Vous devez être connecté pour contacter ce professionnel');
      navigate('/auth');
      return;
    }

    if (currentUserId === id) {
      toast.error('Vous ne pouvez pas vous envoyer un message à vous-même');
      return;
    }

    try {
      // Déterminer l'ordre des participants
      const participant1 = currentUserId < id! ? currentUserId : id!;
      const participant2 = currentUserId < id! ? id! : currentUserId;

      // Vérifier si une conversation existe déjà
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_1_id', participant1)
        .eq('participant_2_id', participant2)
        .maybeSingle();

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        // Créer une nouvelle conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: participant1,
            participant_2_id: participant2,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;

        // Envoyer un message automatique
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            receiver_id: id,
            content: `Bonjour, je suis intéressé(e) par vos services.`,
          });
      }

      // Rediriger vers la conversation
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error: unknown) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = currentUserId === id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header avec bouton retour */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        {isOwnProfile && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-center flex items-center justify-center gap-2">
              <Eye className="h-4 w-4" />
              <strong>Aperçu</strong> : Ceci est la vue que les clients voient de votre profil
            </p>
          </div>
        )}

        {/* En-tête du profil */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.profile_picture_url || undefined} alt={profile.full_name} />
                  <AvatarFallback className="text-3xl bg-blue-100 text-blue-600">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Informations principales */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                    {profile.company_name && (
                      <div className="flex items-center gap-2 text-lg text-gray-600 mb-2">
                        <Building2 className="h-5 w-5" />
                        {profile.company_name}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {profile.is_rbq_verified && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          RBQ Vérifié
                        </Badge>
                      )}
                      {profile.rbq_number && (
                        <Badge variant="outline">
                          <Award className="h-3 w-3 mr-1" />
                          {profile.rbq_number}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleShare} className="gap-2" variant="outline">
                      <Share2 className="h-4 w-4" />
                      Partager
                    </Button>
                    {!isOwnProfile && (
                      <>
                        <Button onClick={handleContact} className="gap-2" variant="outline">
                          <MessageSquare className="h-4 w-4" />
                          Contacter
                        </Button>
                        {currentUserType === 'client' && profile && (
                          <Button onClick={() => setInviteOpen(true)} className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            Inviter à soumissionner
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.proposalsCount}</div>
                    <div className="text-sm text-gray-600">Propositions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.acceptedProposals}</div>
                    <div className="text-sm text-gray-600">Acceptées</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-600">
                      <Star className="h-6 w-6 fill-yellow-400" />
                      {stats.averageRating}
                    </div>
                    <div className="text-sm text-gray-600">Note moyenne</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{stats.reviewsCount}</div>
                    <div className="text-sm text-gray-600">Avis</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* À propos (bio) */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    À propos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Services offerts */}
            {profile.services_offered && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Services offerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.services_offered}</p>
                </CardContent>
              </Card>
            )}

            {/* Assurances */}
            {profile.insurance_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Assurances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.insurance_info}</p>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {(profile.rbq_number || certifications.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Certifications & accréditations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.rbq_number && (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Licence RBQ</p>
                            <p className="text-sm text-gray-600">{profile.rbq_number}</p>
                          </div>
                        </div>
                        {profile.rbq_certification_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(profile.rbq_certification_url!, '_blank')}
                          >
                            Voir le certificat
                          </Button>
                        )}
                      </div>
                    )}

                    {certifications.map((cert) => {
                      const expired =
                        cert.expires_at && new Date(cert.expires_at) < new Date();
                      const typeLabel =
                        cert.cert_type === 'ccq'
                          ? 'CCQ'
                          : cert.cert_type === 'asp'
                          ? 'ASP Construction'
                          : 'Certification';
                      return (
                        <div
                          key={cert.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            expired
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Award
                              className={`h-5 w-5 shrink-0 ${
                                expired ? 'text-gray-400' : 'text-blue-600'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {typeLabel} — {cert.cert_name}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-0.5">
                                {cert.issuer && <span>Émis par {cert.issuer}</span>}
                                {cert.cert_number && <span>N° {cert.cert_number}</span>}
                                {cert.expires_at && (
                                  <span className={expired ? 'text-red-600' : ''}>
                                    {expired ? 'Expirée le ' : 'Expire le '}
                                    {format(new Date(cert.expires_at), 'PPP', { locale: fr })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {cert.certificate_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => window.open(cert.certificate_url!, '_blank')}
                            >
                              Voir
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {portfolioItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Portfolio ({portfolioItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="group rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.category && (
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                            )}
                            {item.project_date && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.project_date), 'MMM yyyy', { locale: fr })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Avis clients (US-040) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Avis clients ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun avis pour le moment.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-sm font-medium">{review.client_name}</span>
                              {review.project_title && (
                                <Badge variant="outline" className="text-green-700 border-green-300 gap-1 text-[10px] px-1.5 py-0">
                                  <CheckCircle className="h-3 w-3" />
                                  Vérifié
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(review.created_at), 'PPP', { locale: fr })}
                              </span>
                            </div>
                            {review.project_title && (
                              <p className="text-xs text-muted-foreground mb-1">
                                Projet : {review.project_title}
                              </p>
                            )}
                            {review.comment && (
                              <p className="text-sm text-gray-700">{review.comment}</p>
                            )}
                            {REVIEW_CRITERIA.some((c) => review[c.key]) && (
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                {REVIEW_CRITERIA.map((c) => {
                                  const val = review[c.key] as number | null | undefined;
                                  if (!val) return null;
                                  return (
                                    <span key={String(c.key)} className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {c.label}
                                      <span className="flex items-center gap-0.5 font-medium text-foreground">
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                        {val}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {review.pro_reply && (
                              <div className="mt-3 pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-md py-2 pr-3">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Réponse de l'entrepreneur
                                  <span className="text-muted-foreground font-normal">
                                    · {format(new Date(review.pro_reply.created_at), 'PPP', { locale: fr })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {review.pro_reply.content}
                                </p>
                              </div>
                            )}
                          </div>
                          {currentUserId && currentUserId !== review.client_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => {
                                setReportingReview(review);
                                setReportDialogOpen(true);
                              }}
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Coordonnées */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {(profile.city || profile.region) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>
                      {profile.city}
                      {profile.city && profile.region && ', '}
                      {profile.region}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Membre depuis {new Date(profile.created_at).getFullYear()}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {!isOwnProfile && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Intéressé(e) ?</CardTitle>
                  <CardDescription className="text-blue-700">
                    Contactez ce professionnel pour discuter de votre projet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleContact} className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Envoyer un message
                  </Button>
                </CardContent>
              </Card>
            )}

            {isOwnProfile && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">C'est votre profil</CardTitle>
                  <CardDescription className="text-green-700">
                    Modifiez vos informations pour améliorer votre visibilité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate('/pro/profile')}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <FileText className="h-4 w-4" />
                    Modifier mon profil
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Report review dialog (US-040) */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Signaler un avis inapproprié
            </DialogTitle>
            <DialogDescription>
              Notre équipe de modération examinera votre signalement sous 48h.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <Label>Raison du signalement</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason} className="space-y-2">
                {[
                  { value: 'offensive', label: 'Contenu offensant ou haineux' },
                  { value: 'fake', label: 'Avis faux ou trompeur' },
                  { value: 'spam', label: 'Spam ou publicité' },
                  { value: 'irrelevant', label: 'Hors sujet ou sans rapport' },
                  { value: 'other', label: 'Autre raison' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`reason-${value}`} />
                    <Label htmlFor={`reason-${value}`} className="font-normal cursor-pointer">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-detail">Détails supplémentaires (optionnel)</Label>
              <Textarea
                id="report-detail"
                placeholder="Décrivez pourquoi cet avis est inapproprié..."
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReportReview} disabled={submittingReport}>
              {submittingReport ? 'Envoi...' : 'Signaler cet avis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* US-053 — Invite professional to bid */}
      {profile && (
        <InviteProfessionalDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          professionalId={profile.id}
          professionalName={profile.company_name || profile.full_name}
        />
      )}
    </div>
  );
};

export default ProfessionalProfile;

