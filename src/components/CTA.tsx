import { ArrowRight, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden bg-background">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header — centered editorial */}
        <div className="text-center mb-16 sm:mb-20 max-w-2xl mx-auto">
          <span className="font-mono text-[11px] text-foreground/30 uppercase tracking-[0.15em] block mb-6">
            Rejoindre BâtirNet
          </span>
          <h2 className="font-display text-foreground leading-[1.02] mb-6">
            Commencez votre prochain projet.
          </h2>
          <div className="h-px w-16 bg-foreground/12 mx-auto mb-6" />
          <p className="font-body text-lg text-foreground/40 leading-relaxed">
            Rejoignez des milliers de clients et professionnels qui font confiance à BâtirNet.
          </p>
        </div>

        {/* Two CTA cards — editorial split */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">

          {/* Client card — dark */}
          <div className="relative bg-[hsl(214,75%,7%)] p-8 sm:p-10 lg:p-12 group overflow-hidden hover:bg-[hsl(214,70%,10%)] transition-colors duration-500">

            <div className="relative">
              <span className="font-mono text-[10px] text-white/15 uppercase tracking-[0.1em] block mb-8">
                Pour les clients
              </span>

              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white/90 mb-4 leading-tight">
                {t("cta.client.title")}
              </h3>
              <p className="font-body text-base text-white/30 leading-relaxed mb-10">
                {t("cta.client.description")}
              </p>

              <button
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 font-ui font-medium text-sm px-8 py-3.5 bg-white text-[hsl(214,75%,7%)] hover:bg-blue-50 transition-all duration-300 rounded-full group/btn shadow-[0_0_32px_-8px_hsl(210,100%,40%,0.4)]"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t("cta.client.button")}
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6">
                {[
                  t("cta.client.benefits.commitment"),
                  t("cta.client.benefits.response"),
                  t("cta.client.benefits.free"),
                ].map((b) => (
                  <span key={b} className="font-mono text-[10px] text-white/20 uppercase tracking-[0.08em]">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pro card — light */}
          <div className="relative bg-card border border-border p-8 sm:p-10 lg:p-12 group overflow-hidden hover:border-primary/15 transition-colors duration-500">

            <div className="relative">
              <span className="font-mono text-[10px] text-foreground/20 uppercase tracking-[0.1em] block mb-8">
                Pour les professionnels
              </span>

              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-foreground mb-4 leading-tight">
                {t("cta.contractor.title")}
              </h3>
              <p className="font-body text-base text-foreground/35 leading-relaxed mb-10">
                {t("cta.contractor.description")}
              </p>

              <button
                className="w-full sm:w-auto inline-flex items-center justify-center font-ui font-medium text-sm px-8 py-3.5 bg-primary text-white hover:bg-[hsl(210,100%,33%)] transition-all duration-300 rounded-full"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t("cta.contractor.button")}
              </button>

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6">
                {[
                  t("cta.contractor.benefits.trial"),
                  t("cta.contractor.benefits.payments"),
                ].map((b) => (
                  <span key={b} className="font-mono text-[10px] text-foreground/20 uppercase tracking-[0.08em]">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CTA;
