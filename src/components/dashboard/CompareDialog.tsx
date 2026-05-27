import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  MapPin, 
  Star, 
  Award, 
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ComparisonProfessional {
  professional_id: string;
  full_name: string;
  company_name: string;
  rbq_number: string;
  services_offered: string | null;
  city: string | null;
  region: string | null;
  years_experience: number | null;
  average_rating: number;
  total_reviews: number;
  total_projects: number;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  availability_status: 'available' | 'busy' | 'unavailable' | null;
  available_from: string | null;
  response_time_hours: number | null;
  activity_score: number | null;
}

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionals: ComparisonProfessional[];
}

const CompareDialog = ({ open, onOpenChange, professionals }: CompareDialogProps) => {
  if (!professionals || professionals.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comparaison impossible</DialogTitle>
            <DialogDescription>
              Veuillez sélectionner au moins un professionnel à comparer.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const getAvailabilityColor = (status: string | null) => {
    switch (status) {
      case 'available': return 'text-success';
      case 'busy': return 'text-warning';
      case 'unavailable': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getAvailabilityLabel = (status: string | null) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'busy': return 'Occupé';
      case 'unavailable': return 'Non disponible';
      default: return 'Non renseigné';
    }
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Comparaison des professionnels</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Comparez les détails, tarifs et disponibilités pour faire votre choix
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {professionals.map((pro) => (
              <div key={pro.professional_id} className="border rounded-lg p-4 space-y-4">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{pro.company_name}</h3>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                  <p className="text-xs text-muted-foreground">{pro.full_name}</p>
                </div>

                <Separator />

                {/* RBQ */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Award className="h-3 w-3" />
                    <span className="text-xs font-medium">RBQ</span>
                  </div>
                  <p className="text-xs font-mono">{pro.rbq_number}</p>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs font-medium">Localisation</span>
                  </div>
                  <p className="text-xs">
                    {[pro.city, pro.region].filter(Boolean).join(', ') || 'Non renseigné'}
                  </p>
                </div>

                {/* Experience */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Expérience</p>
                  <p className="text-xs">
                    {pro.years_experience ? `${pro.years_experience} ans` : 'Non renseigné'}
                  </p>
                </div>

                <Separator />

                {/* Budget */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs font-medium">Taux horaire</span>
                  </div>
                  <p className="text-xs font-semibold">
                    {pro.hourly_rate_min && pro.hourly_rate_max
                      ? `${pro.hourly_rate_min} - ${pro.hourly_rate_max} $/h`
                      : pro.hourly_rate_min
                      ? `À partir de ${pro.hourly_rate_min} $/h`
                      : pro.hourly_rate_max
                      ? `Jusqu'à ${pro.hourly_rate_max} $/h`
                      : 'Non renseigné'}
                  </p>
                </div>

                {/* Availability */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs font-medium">Disponibilité</span>
                  </div>
                  <p className={`text-xs font-medium ${getAvailabilityColor(pro.availability_status)}`}>
                    {getAvailabilityLabel(pro.availability_status)}
                  </p>
                  {pro.available_from && new Date(pro.available_from) > new Date() && (
                    <p className="text-xs text-muted-foreground">
                      Dès le {new Date(pro.available_from).toLocaleDateString('fr-CA')}
                    </p>
                  )}
                </div>

                {/* Response Time */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs font-medium">Temps de réponse</span>
                  </div>
                  <p className="text-xs">
                    {pro.response_time_hours ? `~${pro.response_time_hours}h` : 'Non renseigné'}
                  </p>
                </div>

                {/* Activity Score */}
                {pro.activity_score !== null && pro.activity_score > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs font-medium">Activité</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Score: {pro.activity_score.toFixed(0)}/100
                    </Badge>
                  </div>
                )}

                <Separator />

                {/* Rating */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Évaluation</p>
                  <div className="space-y-1">
                    {renderRating(pro.average_rating)}
                    <p className="text-xs">
                      <span className="font-semibold">{pro.average_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground"> ({pro.total_reviews} avis)</span>
                    </p>
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Projets complétés</p>
                  <p className="text-xs font-semibold">{pro.total_projects}</p>
                </div>

                <Separator />

                {/* Services */}
                {pro.services_offered && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Services</p>
                    <div className="flex flex-wrap gap-1">
                      {pro.services_offered.split(',').slice(0, 3).map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service.trim()}
                        </Badge>
                      ))}
                      {pro.services_offered.split(',').length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{pro.services_offered.split(',').length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comparison Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3">Résumé de la comparaison</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Prix le plus bas</p>
                <p className="font-semibold">
                  {Math.min(
                    ...professionals
                      .map(p => p.hourly_rate_min)
                      .filter((rate): rate is number => rate !== null)
                  )}$/h
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Meilleure note</p>
                <p className="font-semibold">
                  {Math.max(...professionals.map(p => p.average_rating)).toFixed(1)}/5
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Plus d'expérience</p>
                <p className="font-semibold">
                  {Math.max(
                    ...professionals
                      .map(p => p.years_experience)
                      .filter((exp): exp is number => exp !== null)
                  )} ans
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Réponse la plus rapide</p>
                <p className="font-semibold">
                  {Math.min(
                    ...professionals
                      .map(p => p.response_time_hours)
                      .filter((time): time is number => time !== null)
                  )}h
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CompareDialog;

