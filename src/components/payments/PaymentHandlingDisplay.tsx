import { Banknote, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// `platform` remains in the type only for historical records created before the
// direct-settlement product decision. The database normalizes all new writes to
// `offline`; neither value means that BâtirNet handles funds.
export type PaymentHandlingMode = "platform" | "offline";
export type PaymentHandlingPreference = PaymentHandlingMode | "negotiable";
export type PaymentHandlingAudience = "client" | "pro" | "neutral";

export const PAYMENT_HANDLING_SELECT_OPTIONS: Record<PaymentHandlingMode, string> = {
  platform: "Règlement direct entre les parties (ancien choix)",
  offline: "Règlement direct — virement / chèque / comptant",
};

export function getPaymentHandlingHint(
  _mode: PaymentHandlingMode,
  audience: PaymentHandlingAudience
): string {
  if (audience === "pro") {
    return "Le client vous paie directement. BâtirNet ne reçoit ni ne conserve les fonds : le client peut marquer le paiement comme envoyé, puis vous confirmez sa réception.";
  }
  if (audience === "client") {
    return "Vous réglez l'entrepreneur directement. BâtirNet ne reçoit ni ne conserve les fonds : vous pouvez marquer le paiement comme envoyé, puis l'entrepreneur confirme sa réception.";
  }
  return "Le règlement se fait directement entre le client et l'entrepreneur. BâtirNet sert uniquement à suivre les statuts envoyé et reçu.";
}

interface PaymentHandlingBadgeProps {
  mode: PaymentHandlingMode;
  className?: string;
}

export function PaymentHandlingBadge({ className }: PaymentHandlingBadgeProps) {
  return (
    <Badge className={cn("gap-1 border bg-muted text-foreground border-border", className)}>
      <Banknote className="h-3 w-3 shrink-0" aria-hidden="true" />
      Règlement direct
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
  if (!preference) return null;

  const label =
    preference === "platform"
      ? "Ce projet utilisait l'ancien choix de paiement via la plateforme. Le règlement se fait désormais directement entre les parties."
      : preference === "negotiable"
        ? "La modalité avait été laissée à discuter. Le règlement se fait directement entre les parties et BâtirNet en suit seulement le statut."
        : "Le client a indiqué un règlement direct avec l'entrepreneur.";

  return (
    <Alert className={cn("border-primary/20 bg-primary/5", className)}>
      <Info className="h-4 w-4 text-primary" aria-hidden="true" />
      <AlertDescription className="text-sm text-foreground">{label}</AlertDescription>
    </Alert>
  );
}
