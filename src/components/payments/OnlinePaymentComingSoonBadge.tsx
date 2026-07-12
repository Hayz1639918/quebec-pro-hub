import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Indicateur unique « Paiement en ligne — à venir » affiché partout où le
 * paiement Stripe est référencé, tant que l'intégration n'est pas activée
 * (isStripeConfigured() === false).
 */
const OnlinePaymentComingSoonBadge = ({ className }: { className?: string }) => (
  <Badge
    variant="outline"
    className={cn(
      "gap-1 border-warning/40 bg-warning-light/60 text-warning font-medium",
      className
    )}
  >
    <Clock className="h-3 w-3" aria-hidden="true" />
    Paiement en ligne — à venir
  </Badge>
);

export default OnlinePaymentComingSoonBadge;
