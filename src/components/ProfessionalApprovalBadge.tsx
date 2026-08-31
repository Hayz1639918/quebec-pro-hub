import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProfessionalApprovalBadgeProps = {
  className?: string;
};

/** Display-only trust signal. Never use this badge as an authorization guard. */
export const ProfessionalApprovalBadge = ({ className }: ProfessionalApprovalBadgeProps) => {
  const { t } = useTranslation();

  return (
    <Badge className={cn("w-fit rounded-full bg-emerald-600 text-white hover:bg-emerald-600", className)}>
      <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
      {t("professionals.card.verified")}
    </Badge>
  );
};
