import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[360px] bg-primary/10 blur-[130px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10">
          <span className="inline-block font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary">Rejoindre BâtirNet</span>
        </div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
          <div className="group rounded-xl border border-primary/30 bg-card p-6 sm:p-8 lg:p-10 relative overflow-hidden card-lift">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_45%)]" />
            <div className="relative mb-6">
              <div className="inline-flex p-3 rounded-md bg-primary/10 border border-primary/20 mb-5">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground mb-3 leading-snug">{t("cta.client.title")}</h3>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">{t("cta.client.description")}</p>
            </div>

            <div className="relative space-y-3">
              <Button size="lg" className="w-full font-ui font-semibold uppercase tracking-wider group/btn" onClick={() => navigate("/auth?mode=signup")}>
                {t("cta.client.button")}
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-ui">
                <span className="flex items-center gap-1"><span className="text-primary">✓</span> {t("cta.client.benefits.commitment")}</span>
                <span className="flex items-center gap-1"><span className="text-primary">✓</span> {t("cta.client.benefits.response")}</span>
                <span className="flex items-center gap-1"><span className="text-primary">✓</span> {t("cta.client.benefits.free")}</span>
              </div>
            </div>
          </div>

          <div className="group rounded-xl border border-border bg-card p-6 sm:p-8 lg:p-10 relative overflow-hidden card-lift">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,transparent_40%,hsl(var(--primary)/0.06)_100%)]" />
            <div className="relative mb-6">
              <div className="inline-flex p-3 rounded-md bg-muted border border-border mb-5 group-hover:border-primary/20 transition-colors">
                <Briefcase className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground mb-3 leading-snug">{t("cta.contractor.title")}</h3>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">{t("cta.contractor.description")}</p>
            </div>

            <div className="relative space-y-3">
              <Button variant="outline" size="lg" className="w-full font-ui font-medium border-border hover:border-primary/50 hover:text-primary group/btn" onClick={() => navigate("/auth?mode=signup")}>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("cta.contractor.button")}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-ui">
                <span className="flex items-center gap-1"><span className="text-primary">✓</span> {t("cta.contractor.benefits.trial")}</span>
                <span className="flex items-center gap-1"><span className="text-primary">✓</span> {t("cta.contractor.benefits.payments")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
