import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden bg-background">

      {/* Blueprint grid */}
      <div className="absolute inset-0 blueprint-grid opacity-45 pointer-events-none" />

      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      {/* Side annotation */}
      <div className="absolute top-12 left-4 sm:left-8 font-mono text-[9px] text-primary/30 uppercase tracking-[0.2em] pointer-events-none hidden md:block">
        <div>SEC. 004</div>
        <div className="mt-1 opacity-60">INSCRIPTION</div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-primary" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Rejoindre BâtirNet
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <p className="font-body text-muted-foreground text-base max-w-lg mx-auto">
            Rejoignez des milliers de clients et professionnels qui font confiance à BâtirNet.
          </p>
        </div>

        {/* Two CTA cards */}
        <div className="grid md:grid-cols-2 gap-px bg-border/60 max-w-5xl mx-auto">

          {/* Client card */}
          <div className="relative bg-[hsl(214,75%,7%)] p-7 sm:p-8 lg:p-10 group overflow-hidden hover:bg-[hsl(214,70%,9%)] transition-colors">
            {/* Blueprint grid inside card */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: `
                  linear-gradient(hsl(210,100%,65%,0.18) 1px, transparent 1px),
                  linear-gradient(90deg, hsl(210,100%,65%,0.18) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400/40" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400/40" />
            <div className="absolute top-4 right-4 font-mono text-[9px] text-blue-400/25 uppercase tracking-[0.15em]">TYPE-A</div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border border-blue-400/30 bg-blue-400/12">
                  <ArrowRight className="h-6 w-6 text-blue-400" />
                </div>
                <div className="h-px flex-1 bg-blue-400/20" />
              </div>

              <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3 leading-tight">
                {t("cta.client.title")}
              </h3>
              <p className="font-body text-sm sm:text-base text-white/50 leading-relaxed mb-8">
                {t("cta.client.description")}
              </p>

              <button
                className="w-full min-h-[52px] font-ui font-bold text-sm uppercase tracking-[0.1em] bg-primary hover:bg-[hsl(210,100%,33%)] text-white transition-all duration-300 flex items-center justify-center gap-3 group/btn shadow-[0_0_32px_-8px_hsl(210,100%,40%,0.5)] hover:shadow-[0_0_48px_-4px_hsl(210,100%,40%,0.7)]"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t("cta.client.button")}
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4">
                {[
                  t("cta.client.benefits.commitment"),
                  t("cta.client.benefits.response"),
                  t("cta.client.benefits.free"),
                ].map((b) => (
                  <span key={b} className="flex items-center gap-1.5 font-mono text-[9px] text-blue-400/60 uppercase tracking-[0.1em]">
                    <span className="w-1 h-1 bg-blue-400/60 flex-shrink-0" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pro card */}
          <div className="relative bg-card p-7 sm:p-8 lg:p-10 group overflow-hidden hover:bg-primary/[0.03] transition-colors border-t md:border-t-0 border-border/60">
            {/* Blueprint grid inside card */}
            <div className="absolute inset-0 blueprint-grid opacity-30 pointer-events-none" />

            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/0 group-hover:border-primary/30 transition-colors" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/0 group-hover:border-primary/30 transition-colors" />
            <div className="absolute top-4 right-4 font-mono text-[9px] text-primary/25 uppercase tracking-[0.15em]">TYPE-B</div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 border border-border bg-muted group-hover:border-primary/25 group-hover:bg-primary/8 transition-all">
                  <Briefcase className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="h-px flex-1 bg-border group-hover:bg-primary/20 transition-colors" />
              </div>

              <h3 className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-3 leading-tight">
                {t("cta.contractor.title")}
              </h3>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
                {t("cta.contractor.description")}
              </p>

              <button
                className="w-full min-h-[52px] font-ui font-semibold text-sm uppercase tracking-[0.08em] border-2 border-primary/30 hover:border-primary/60 bg-transparent hover:bg-primary/8 text-foreground hover:text-primary transition-all duration-300 flex items-center justify-center gap-3"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t("cta.contractor.button")}
              </button>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4">
                {[
                  t("cta.contractor.benefits.trial"),
                  t("cta.contractor.benefits.payments"),
                ].map((b) => (
                  <span key={b} className="flex items-center gap-1.5 font-mono text-[9px] text-primary/50 uppercase tracking-[0.1em]">
                    <span className="w-1 h-1 bg-primary/50 flex-shrink-0" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom dimension annotation */}
        <div className="mt-8 flex items-center justify-center gap-3 opacity-40">
          <div className="h-px w-12 bg-primary/60" />
          <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.25em]">
            INSCRIPTION GRATUITE — SANS ENGAGEMENT
          </span>
          <div className="h-px w-12 bg-primary/60" />
        </div>
      </div>
    </section>
  );
};

export default CTA;
