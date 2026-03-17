import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "/logo-batirnet.png";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const links = {
    company: [
      { label: t("footer.company.about"), href: "#" },
      { label: t("footer.company.careers"), href: "#" },
      { label: t("footer.company.blog"), href: "#" },
      { label: t("footer.company.contact"), href: "#" },
    ],
    resources: [
      { label: t("footer.resources.help_center"), href: "#" },
      { label: t("footer.resources.client_guide"), href: "#" },
      { label: t("footer.resources.contractor_guide"), href: "#" },
      { label: t("footer.resources.faq"), href: "#" },
    ],
    legal: [
      { label: t("footer.legal.terms"), href: "#" },
      { label: t("footer.legal.privacy"), href: "/privacy-policy" },
      { label: t("footer.legal.cookies"), href: "#" },
      { label: t("footer.legal.compliance"), href: "/privacy-policy" },
    ],
  };

  return (
    <footer className="relative bg-[hsl(210,100%,32%)] overflow-hidden">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">

        {/* Top divider */}
        <div className="h-px w-full bg-white/6 mb-16 sm:mb-20" />

        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 mb-16 sm:mb-20">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-5 space-y-6">
            <img src={logo} alt="BâtirNet Logo" className="h-10 sm:h-12 w-auto object-contain" />

            <p className="font-body text-sm text-white/25 leading-relaxed max-w-[280px]">
              {t("footer.tagline")}
            </p>

            <div className="font-mono text-[10px] text-white/15 uppercase tracking-[0.1em] leading-loose">
              <div>Québec, Canada</div>
              <div>RBQ certifié</div>
            </div>
          </div>

          {/* Link columns */}
          {[
            { title: t("footer.company.title"), items: links.company },
            { title: t("footer.resources.title"), items: links.resources },
            { title: t("footer.legal.title"), items: links.legal },
          ].map(({ title, items }) => (
            <div key={title} className="col-span-1 md:col-span-2 lg:col-span-2">
              <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-white/30 mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="group inline-flex items-center gap-1 font-body text-sm text-white/20 hover:text-white/50 transition-colors"
                    >
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="h-px w-full bg-white/6 mb-6" />
        <div className="pb-safe flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-mono text-[10px] text-white/15 uppercase tracking-[0.1em]">
            © {currentYear} BâtirNet. {t("footer.rights")}
          </p>
          <p className="font-mono text-[10px] text-white/10 uppercase tracking-[0.08em]">
            {t("footer.made_with_love")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
