import { Shield, Banknote, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type PaymentHandlingMode = "platform" | "offline";
export type PaymentHandlingPreference = PaymentHandlingMode | "negotiable";
export type PaymentHandlingAudience = "client" | "pro" | "neutral";

export const PAYMENT_HANDLING_SELECT_OPTIONS: Record<PaymentHandlingMode, string> = {
  platform: "Via la plateforme (paiement en ligne sécurisé)",
  offline: "Hors plateforme (virement / chèque / comptant)",
};

export function getPaymentHandlingHint(
  mode: PaymentHandlingMode,
  audience: PaymentHandlingAudience
): string {
  if (audience === "pro") {
    return mode === "offline"
      ? "Vous marquerez chaque paiement reçu directement du client dans l'espace Paiements."
      : "Les paiements transitent par BâtirNet (escrow) et sont libérés à la validation des jalons.";
  }
  if (audience === "client") {
    return mode === "offline"
      ? "Vous réglez l'entrepreneur directement (virement, chèque ou comptant). L'entrepreneur confirme la réception dans l'app."
      : "Vous payez en ligne via BâtirNet. Les fonds sont protégés jusqu'à validation de chaque jalon.";
  }
  return mode === "offline"
    ? "Le client règle l'entrepreneur directement. L'entrepreneur confirme chaque paiement reçu dans l'espace Paiements."
    : "Les paiements transitent par la plateforme (escrow) et sont libérés à la validation des jalons.";
}

interface PaymentHandlingBadgeProps {
  mode: PaymentHandlingMode;
  className?: string;
}

export function PaymentHandlingBadge({ mode, className }: PaymentHandlingBadgeProps) {
  const Icon = mode === "offline" ? Banknote : Shield;
  const label =
    mode === "offline"
      ? "Hors plateforme — virement / chèque / comptant"
      : "Via la plateforme — paiement en ligne sécurisé";

  return (
    <Badge
      className={cn(
        "gap-1 border",
        mode === "offline"
          ? "bg-muted text-foreground border-border"
          : "bg-primary/10 text-primary border-primary/20",
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {label}
    </Badge>
  );
}

interface PaymentHandlingHintProps {
  mode: PaymentHandlingMode;
  audience?: PaymentHandlingAudience;
  className?: string;
  id?: string;
}

export function PaymentHandlingHint({
  mode,
  audience = "neutral",
  className,
  id,
}: PaymentHandlingHintProps) {
  return (
    <p id={id} className={cn("text-xs text-muted-foreground", className)}>
      {getPaymentHandlingHint(mode, audience)}
    </p>
  );
}

interface PaymentHandlingPreferenceNoticeProps {
  preference: PaymentHandlingPreference | null | undefined;
  className?: string;
}

export function PaymentHandlingPreferenceNotice({
  preference,
  className,
}: PaymentHandlingPreferenceNoticeProps) {
  if (!preference || preference === "negotiable") return null;

  const label =
    preference === "platform"
      ? "Le client a indiqué préférer un règlement via la plateforme."
      : "Le client a indiqué préférer un règlement hors plateforme.";

  return (
    <Alert className={cn("border-primary/20 bg-primary/5", className)}>
      <Info className="h-4 w-4 text-primary" aria-hidden="true" />
      <AlertDescription className="text-sm text-foreground">{label}</AlertDescription>
    </Alert>
  );
}
