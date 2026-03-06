import { Facebook, Twitter, Linkedin, Instagram, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "/logo-batirnet.png";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const links = {
    company: [
      { label: t('footer.company.about'), href: "#" },
      { label: t('footer.company.careers'), href: "#" },
      { label: t('footer.company.blog'), href: "#" },
      { label: t('footer.company.contact'), href: "#" },
    ],
    resources: [
      { label: t('footer.resources.help_center'), href: "#" },
      { label: t('footer.resources.client_guide'), href: "#" },
      { label: t('footer.resources.contractor_guide'), href: "#" },
      { label: t('footer.resources.faq'), href: "#" },
    ],
    legal: [
      { label: t('footer.legal.terms'), href: "#" },
      { label: t('footer.legal.privacy'), href: "/privacy-policy" },
      { label: t('footer.legal.cookies'), href: "#" },
      { label: t('footer.legal.compliance'), href: "/privacy-policy" },
    ],
  };

  return (
    <footer className="relative border-t border-border overflow-hidden">
      {/* Subtle amber glow top-left */}
      <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-primary/3 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 mb-12 sm:mb-16">

          {/* ── Brand ── */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <img
              src={logo}
              alt="BâtirNet Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              {t('footer.tagline')}
            </p>
            {/* Socials */}
            <div className="flex gap-3">
              {[
                { Icon: Facebook,  href: "#", label: "Facebook" },
                { Icon: Twitter,   href: "#", label: "Twitter" },
                { Icon: Linkedin,  href: "#", label: "LinkedIn" },
                { Icon: Instagram, href: "#", label: "Instagram" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Link columns ── */}
          {[
            { title: t('footer.company.title'),   items: links.company   },
            { title: t('footer.resources.title'), items: links.resources },
            { title: t('footer.legal.title'),     items: links.legal     },
          ].map(({ title, items }) => (
            <div key={title}>
              <h4 className="font-ui text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="group inline-flex items-center gap-1 font-body text-sm text-foreground/60 hover:text-foreground transition-colors py-0.5"
                    >
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="pt-8 border-t border-border pb-safe flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-ui text-xs text-muted-foreground">
            © {currentYear} BâtirNet. {t('footer.rights')}
          </p>
          <p className="font-ui text-xs text-muted-foreground">
            {t('footer.made_with_love')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
