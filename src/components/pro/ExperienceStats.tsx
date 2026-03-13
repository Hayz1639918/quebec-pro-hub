// US-110: Experience Stats
// Years of experience, number of projects, business volume
// Manual fields + auto-calculated from platform history

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Briefcase, DollarSign, Star, RefreshCw, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExperienceStatsProps {
  professionalId: string;
}

interface PlatformStats {
  platform_projects: number;
  platform_proposals: number;
  avg_rating: number;
  total_reviews: number;
}

interface ProfileFields {
  years_experience?: number | null;
  total_projects_external?: number | null;
  business_volume_cad?: number | null;
}

const ExperienceStats = ({ professionalId }: ExperienceStatsProps) => {
  const { toast } = useToast();
  const [fields, setFields] = useState<ProfileFields>({});
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    platform_projects: 0,
    platform_proposals: 0,
    avg_rating: 0,
    total_reviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Promise.all([fetchProfileFields(), fetchPlatformStats()]).finally(() => setLoading(false));
  }, [professionalId]);

  const fetchProfileFields = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("years_experience, total_projects_external, business_volume_cad")
      .eq("id", professionalId)
      .single();
    if (data) setFields(data);
  };

  const fetchPlatformStats = async () => {
    // Platform-calculated stats
    const [proposalsRes, reviewsRes, projectsRes] = await Promise.all([
      supabase
        .from("proposals")
        .select("id", { count: "exact" })
        .eq("professional_id", professionalId)
        .eq("status", "accepted"),
      supabase
        .from("reviews")
        .select("rating")
        .eq("professional_id", professionalId),
      supabase
        .from("profiles")
        .select("average_rating, total_reviews, total_projects_completed")
        .eq("id", professionalId)
        .single(),
    ]);

    const acceptedProposals = proposalsRes.count ?? 0;
    const reviews = reviewsRes.data ?? [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
        : 0;

    setPlatformStats({
      platform_projects: acceptedProposals,
      platform_proposals: acceptedProposals,
      avg_rating: projectsRes.data?.average_rating ?? avgRating,
      total_reviews: projectsRes.data?.total_reviews ?? reviews.length,
    });
  };

  const saveStats = async () => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (fields.years_experience !== undefined) updateData.years_experience = fields.years_experience ? Number(fields.years_experience) : null;
      if (fields.total_projects_external !== undefined) updateData.total_projects_external = fields.total_projects_external ? Number(fields.total_projects_external) : null;
      if (fields.business_volume_cad !== undefined) updateData.business_volume_cad = fields.business_volume_cad ? Number(fields.business_volume_cad) : null;

      const { error } = await supabase.from("profiles").update(updateData).eq("id", professionalId);
      if (error) throw error;

      toast({ title: "Statistiques enregistrées", description: "Votre profil a été mis à jour." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder." });
    } finally {
      setSaving(false);
    }
  };

  const refreshPlatformStats = async () => {
    setRefreshing(true);
    await fetchPlatformStats();
    setRefreshing(false);
    toast({ title: "Statistiques actualisées" });
  };

  const totalProjects = (fields.total_projects_external ?? 0) + platformStats.platform_projects;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Chargement des statistiques...</CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Expérience et historique
          </CardTitle>
          <CardDescription>
            Renseignez votre expérience totale. Les statistiques de la plateforme sont calculées automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informations déclarées
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years_exp" className="flex items-center gap-1">
                  Années d'expérience
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nombre d'années de pratique dans votre domaine</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="years_exp"
                  type="number"
                  min="0"
                  max="60"
                  value={fields.years_experience ?? ""}
                  onChange={(e) => setFields({ ...fields, years_experience: e.target.value ? Number(e.target.value) : null })}
                  placeholder="ex : 15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ext_projects" className="flex items-center gap-1">
                  Projets hors plateforme
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nombre de projets réalisés avant ou hors BâtirNet</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="ext_projects"
                  type="number"
                  min="0"
                  value={fields.total_projects_external ?? ""}
                  onChange={(e) => setFields({ ...fields, total_projects_external: e.target.value ? Number(e.target.value) : null })}
                  placeholder="ex : 150"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="biz_volume" className="flex items-center gap-1">
                  Volume d'affaires (CAD)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Chiffre d'affaires approximatif (optionnel)</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="biz_volume"
                  type="number"
                  min="0"
                  step="1000"
                  value={fields.business_volume_cad ?? ""}
                  onChange={(e) => setFields({ ...fields, business_volume_cad: e.target.value ? Number(e.target.value) : null })}
                  placeholder="ex : 500000"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={saveStats} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Platform stats (read-only, auto-calculated) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Statistiques BâtirNet (automatiques)
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPlatformStats}
                disabled={refreshing}
                className="h-7 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-primary/5 rounded-lg text-center space-y-1">
                <Briefcase className="h-5 w-5 mx-auto text-primary" />
                <p className="text-2xl font-bold text-primary">{totalProjects}</p>
                <p className="text-xs text-muted-foreground">Projets totaux</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-center space-y-1">
                <Briefcase className="h-5 w-5 mx-auto text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">{platformStats.platform_projects}</p>
                <p className="text-xs text-muted-foreground">Via BâtirNet</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg text-center space-y-1">
                <Star className="h-5 w-5 mx-auto text-amber-500" />
                <p className="text-2xl font-bold text-amber-700">
                  {platformStats.avg_rating > 0 ? platformStats.avg_rating.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg text-center space-y-1">
                <DollarSign className="h-5 w-5 mx-auto text-green-600" />
                <p className="text-2xl font-bold text-green-700">
                  {fields.years_experience ? `${fields.years_experience} ans` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Expérience</p>
              </div>
            </div>

            {fields.business_volume_cad && (
              <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Volume d'affaires : {new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(fields.business_volume_cad)}
                  </p>
                  <p className="text-xs text-muted-foreground">Valeur déclarée</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ExperienceStats;
