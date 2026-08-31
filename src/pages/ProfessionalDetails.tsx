import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Share2,
  Star,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InviteProfessionalDialog from "@/components/invitations/InviteProfessionalDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfessionalApprovalBadge } from "@/components/ProfessionalApprovalBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type PublicProfessional = {
  id: string;
  full_name: string;
  company_name: string | null;
  services_offered: string | null;
  city: string | null;
  region: string | null;
  bio: string | null;
  years_experience: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_projects: number | null;
  profile_picture_url: string | null;
  availability_status: "available" | "busy" | "unavailable" | null;
  response_time_hours: number | null;
  professional_type: string | null;
  is_rbq_verified: boolean;
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_date: string | null;
  category: string | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const initials = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

const availabilityLabel = (status: PublicProfessional["availability_status"]) => {
  if (status === "available") return "Disponible";
  if (status === "busy") return "Occupé";
  if (status === "unavailable") return "Indisponible";
  return "À confirmer";
};

const ProfessionalDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfessional | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<"client" | "professional" | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!active) return;
      setCurrentUserId(authData.user?.id || null);

      if (authData.user) {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (active && (currentProfile?.user_type === "client" || currentProfile?.user_type === "professional")) {
          setCurrentUserType(currentProfile.user_type);
        }
      }

      const [profileResult, portfolioResult, reviewsResult] = await Promise.all([
        supabase
          .from("public_professional_profiles")
          .select(`
            id,
            full_name,
            company_name,
            services_offered,
            city,
            region,
            bio,
            years_experience,
            average_rating,
            total_reviews,
            total_projects,
            profile_picture_url,
            availability_status,
            response_time_hours,
            professional_type,
            is_rbq_verified
          `)
          .eq("id", id)
          .eq("user_type", "professional")
          .maybeSingle(),
        supabase
          .from("portfolio_items")
          .select("id, title, description, image_url, project_date, category")
          .eq("professional_id", id)
          .order("project_date", { ascending: false })
          .limit(9),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at")
          .eq("professional_id", id)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (!active) return;
      if (profileResult.error) {
        console.error("Unable to load professional profile", profileResult.error);
        toast.error("Impossible de charger ce profil pour le moment");
        setProfile(null);
      } else {
        setProfile(profileResult.data as PublicProfessional | null);
      }
      setPortfolio((portfolioResult.data || []) as PortfolioItem[]);
      setReviews((reviewsResult.data || []) as Review[]);
      setLoading(false);
    };

    void load();
    return () => { active = false; };
  }, [id]);

  const reviewAverage = useMemo(() => {
    if (reviews.length) return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
    return Number(profile?.average_rating || 0);
  }, [profile?.average_rating, reviews]);

  const services = useMemo(() => (profile?.services_offered || "")
    .split(",")
    .map((service) => service.trim())
    .filter(Boolean), [profile?.services_offered]);

  const startConversation = async () => {
    if (!profile) return;
    if (!currentUserId) {
      navigate("/auth?mode=login");
      return;
    }
    if (currentUserId === profile.id) return;

    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      user_1_id: currentUserId,
      user_2_id: profile.id,
    });
    if (error) {
      console.error("Unable to start conversation", error);
      toast.error("Impossible d'ouvrir la conversation pour le moment");
      return;
    }
    if (data) navigate(`/messages?conversation=${data}`);
  };

  const shareProfile = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: profile?.company_name || profile?.full_name || "Profil BâtirNet",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      // Native share cancellation is not an error the user needs to see.
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc]">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 max-w-7xl space-y-5">
          <Skeleton className="h-56 rounded-[1.75rem]" />
          <div className="grid lg:grid-cols-3 gap-5">
            <Skeleton className="lg:col-span-2 h-72 rounded-[1.5rem]" />
            <Skeleton className="h-72 rounded-[1.5rem]" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
        <Navigation />
        <main className="flex-1 grid place-items-center px-4 pt-24">
          <div className="bn-surface text-center max-w-lg">
            <UserRound className="h-10 w-10 text-primary/45 mx-auto" />
            <h1 className="mt-4 text-xl font-bold text-primary">Profil introuvable</h1>
            <p className="mt-2 text-sm text-slate-600">Ce profil n'est plus disponible ou n'a pas pu être chargé.</p>
            <Button onClick={() => navigate("/professionals")} className="mt-5 rounded-full">Retour au répertoire</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20 sm:pt-24">
        <section className="bn-page-hero border-b border-slate-200/70">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full -ml-3 text-primary/70">
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>

            <div className="mt-5 flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8 bn-reveal">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-[1.6rem] border-4 border-white shadow-lg">
                <AvatarImage src={profile.profile_picture_url || undefined} alt={profile.full_name} className="object-cover" />
                <AvatarFallback className="rounded-[1.4rem] bg-primary/10 text-primary text-2xl font-bold">{initials(profile.full_name)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary/55">
                    {profile.professional_type === "entrepreneur" ? "Entrepreneur" : "Professionnel"}
                  </p>
                  {profile.is_rbq_verified && (
                    <ProfessionalApprovalBadge />
                  )}
                </div>
                <h1 className="mt-2 font-ui text-3xl sm:text-5xl font-bold text-primary tracking-tight leading-tight">
                  {profile.company_name || profile.full_name}
                </h1>
                {profile.company_name && <p className="mt-1 text-sm text-slate-500">{profile.full_name}</p>}
                {(profile.city || profile.region) && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4 text-primary/65" />{[profile.city, profile.region].filter(Boolean).join(", ")}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <Button variant="outline" onClick={() => void shareProfile()} className="rounded-full bg-white"><Share2 className="h-4 w-4 mr-2" />Partager</Button>
                {!isOwnProfile && <Button onClick={() => void startConversation()} className="rounded-full"><MessageSquare className="h-4 w-4 mr-2" />Message</Button>}
                {!isOwnProfile && currentUserType === "client" && <Button variant="outline" onClick={() => setInviteOpen(true)} className="rounded-full bg-white"><BriefcaseBusiness className="h-4 w-4 mr-2" />Inviter</Button>}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Metric label="Avis" value={Number(profile.total_reviews || reviews.length) > 0 ? `${reviewAverage.toFixed(1)} / 5` : "—"} icon={<Star className="h-4 w-4" />} />
            <Metric label="Expérience" value={profile.years_experience ? `${profile.years_experience} an${profile.years_experience > 1 ? "s" : ""}` : "À consulter"} icon={<CalendarDays className="h-4 w-4" />} />
            <Metric label="Projets" value={String(Number(profile.total_projects || 0))} icon={<BriefcaseBusiness className="h-4 w-4" />} />
            <Metric label="Disponibilité" value={availabilityLabel(profile.availability_status)} icon={<CalendarDays className="h-4 w-4" />} />
          </div>

          <div className="grid lg:grid-cols-[1.55fr_.85fr] gap-6">
            <div className="space-y-6">
              {(profile.bio || services.length > 0) && (
                <Card className="rounded-[1.5rem] border-slate-200/80 shadow-sm overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    {profile.bio && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/55">À propos</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-slate-600">{profile.bio}</p>
                      </div>
                    )}
                    {services.length > 0 && (
                      <div className={profile.bio ? "mt-7 pt-7 border-t border-slate-100" : ""}>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/55">Services</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {services.map((service) => <Badge key={service} variant="secondary" className="rounded-full px-3 py-1.5">{service}</Badge>)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div>
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/55">Réalisations</p>
                    <h2 className="mt-1 font-ui text-2xl font-bold text-primary">Portfolio</h2>
                  </div>
                  {portfolio.length > 0 && <span className="text-xs text-slate-500">{portfolio.length} réalisation{portfolio.length > 1 ? "s" : ""}</span>}
                </div>

                {portfolio.length === 0 ? (
                  <div className="bn-surface text-center py-9">
                    <ImageIcon className="h-8 w-8 mx-auto text-primary/35" />
                    <p className="mt-3 text-sm text-slate-600">Aucune réalisation n'est publiée sur ce profil pour le moment.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {portfolio.map((item, index) => (
                      <article key={item.id} className="overflow-hidden rounded-[1.35rem] bg-white border border-slate-200/80 shadow-sm bn-card-lift bn-reveal" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
                        {item.image_url ? <img src={item.image_url} alt={item.title} className="h-44 w-full object-cover" loading="lazy" /> : <div className="h-32 bg-primary/5 grid place-items-center"><ImageIcon className="h-8 w-8 text-primary/25" /></div>}
                        <div className="p-4">
                          <h3 className="font-semibold text-primary">{item.title}</h3>
                          {item.category && <p className="mt-1 text-xs text-slate-500">{item.category}</p>}
                          {item.description && <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">{item.description}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-5">
              <Card className="rounded-[1.5rem] border-slate-200/80 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/55">Derniers avis</p>
                  <div className="mt-4 space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-sm text-slate-600">Aucun avis publié pour le moment.</p>
                    ) : reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} sur 5`}>
                          {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "opacity-20"}`} />)}
                        </div>
                        {review.comment && <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {!isOwnProfile && (
                <div className="rounded-[1.5rem] bg-primary p-6 text-white shadow-[0_20px_50px_-32px_rgba(13,43,69,0.75)]">
                  <h2 className="font-ui text-xl font-bold">Un profil vous intéresse ?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">Échangez directement dans BâtirNet pour préciser votre projet et les prochaines étapes.</p>
                  <Button onClick={() => void startConversation()} className="mt-5 rounded-full bg-white text-primary hover:bg-white/90 w-full">Contacter</Button>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <Footer />

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

const Metric = ({ label, value, icon }: { label: string; value: string; icon: ReactNode }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</div>
    <p className="mt-2 font-semibold text-primary truncate">{value}</p>
  </div>
);

export default ProfessionalDetails;
