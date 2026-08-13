import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const links = {
    company: [
      { label: t("footer.company.about"), href: "/about" },
      { label: t("footer.company.careers"), href: "/careers" },
      { label: t("footer.company.blog"), href: "/blog" },
      { label: t("footer.company.contact"), href: "/contact" },
    ],
    resources: [
      { label: t("footer.resources.help_center"), href: "/help" },
      { label: t("footer.resources.client_guide"), href: "/guide/client" },
      { label: t("footer.resources.contractor_guide"), href: "/guide/professional" },
      { label: t("footer.resources.faq"), href: "/faq" },
    ],
    legal: [
      { label: t("footer.legal.terms"), href: "/terms-of-service" },
      { label: t("footer.legal.privacy"), href: "/privacy-policy" },
      { label: t("footer.legal.cookies"), href: "/cookies" },
      { label: t("footer.legal.compliance"), href: "/compliance" },
    ],
  };

  return (
    <footer className="relative overflow-hidden bg-primary">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.16),transparent_34rem)]" />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="h-px w-full bg-white/20 mb-10 sm:mb-14" />

        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 mb-10 sm:mb-14">
          <div className="col-span-2 md:col-span-4 lg:col-span-5 space-y-6">
            <Logo size={42} onDark />
            <p className="font-body text-sm text-white/75 leading-relaxed max-w-[300px]">
              {t("footer.tagline")}
            </p>
            <div className="font-mono text-[10px] text-white/60 uppercase tracking-[0.1em] leading-loose">
              <div>Québec, Canada</div>
              <div>Plateforme de mise en relation pour vos projets</div>
            </div>
          </div>

          {[
            { title: t("footer.company.title"), items: links.company },
            { title: t("footer.resources.title"), items: links.resources },
            { title: t("footer.legal.title"), items: links.legal },
          ].map(({ title, items }) => (
            <div key={title} className="col-span-1 md:col-span-2 lg:col-span-2">
              <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-white/75 mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="group inline-flex items-center gap-1.5 font-body text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="h-px w-full bg-white/20 mb-6" />
        <div className="pb-safe flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-mono text-[10px] text-white/60 uppercase tracking-[0.1em]">
            © {currentYear} BâtirNet. {t("footer.rights")}
          </p>
          <p className="font-mono text-[10px] text-white/50 uppercase tracking-[0.08em]">
            {t("footer.made_with_love")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
