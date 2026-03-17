import { Facebook, Twitter, Linkedin, Instagram, ArrowUpRight } from "lucide-react";
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
    <footer className="relative bg-[hsl(214,75%,7%)] border-t border-white/8 overflow-hidden">

      {/* Blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(hsl(210,100%,65%,0.15) 1px, transparent 1px),
            linear-gradient(90deg, hsl(210,100%,65%,0.15) 1px, transparent 1px),
            linear-gradient(hsl(210,100%,65%,0.07) 1px, transparent 1px),
            linear-gradient(90deg, hsl(210,100%,65%,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
        }}
      />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/10 blur-[80px] pointer-events-none" />

      {/* Corner annotation */}
      <div className="absolute top-6 right-4 sm:right-8 font-mono text-[9px] text-blue-400/20 uppercase tracking-[0.2em] text-right pointer-events-none hidden sm:block">
        <div>SEC. 005</div>
        <div className="mt-1 opacity-60">FOOTER</div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative">

        {/* Top horizontal rule with dimension marks */}
        <div className="flex items-center gap-3 mb-12 sm:mb-16">
          <div className="w-2 h-2 border border-blue-400/40 rotate-45 flex-shrink-0" />
          <div className="h-px flex-1 bg-white/8" />
          <span className="font-mono text-[9px] text-blue-400/25 uppercase tracking-[0.2em] whitespace-nowrap">
            BATIRNET © {currentYear}
          </span>
          <div className="h-px flex-1 bg-white/8" />
          <div className="w-2 h-2 border border-blue-400/40 rotate-45 flex-shrink-0" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12 sm:mb-16">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <img src={logo} alt="BâtirNet Logo" className="h-10 sm:h-12 w-auto object-contain brightness-110" />

            <p className="font-body text-sm text-white/45 leading-relaxed max-w-[220px]">
              {t("footer.tagline")}
            </p>

            {/* Social links */}
            <div className="flex gap-2">
              {[
                { Icon: Facebook, href: "#", label: "Facebook" },
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
                { Icon: Instagram, href: "#", label: "Instagram" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 border border-white/12 bg-white/5 flex items-center justify-center text-white/40 hover:text-blue-400 hover:border-blue-400/40 hover:bg-blue-400/10 transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>

            {/* Technical stamp */}
            <div className="border border-blue-400/15 p-2.5 inline-block">
              <div className="font-mono text-[9px] text-blue-400/40 uppercase tracking-[0.15em] leading-loose">
                <div>QC — CA</div>
                <div>RBQ CERTIFIÉ</div>
                <div>PROJ-{currentYear}</div>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {[
            { title: t("footer.company.title"), items: links.company },
            { title: t("footer.resources.title"), items: links.resources },
            { title: t("footer.legal.title"), items: links.legal },
          ].map(({ title, items }) => (
            <div key={title}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-1.5 bg-blue-400/50" />
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400/60">
                  {title}
                </h4>
              </div>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="group inline-flex items-center gap-1.5 font-body text-sm text-white/40 hover:text-white transition-colors py-0.5"
                    >
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-y-0.5 translate-x-0.5 group-hover:translate-y-0 group-hover:translate-x-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/8 pb-safe flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-mono text-[10px] text-white/25 uppercase tracking-[0.12em]">
            © {currentYear} BâtirNet. {t("footer.rights")}
          </p>
          <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.1em]">
            {t("footer.made_with_love")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
