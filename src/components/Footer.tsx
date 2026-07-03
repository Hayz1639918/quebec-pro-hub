import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: t("footer.company.title"),
      items: [
        { label: t("footer.company.about"), href: "#" },
        { label: t("footer.company.careers"), href: "#" },
        { label: t("footer.company.blog"), href: "#" },
        { label: t("footer.company.contact"), href: "#" },
      ],
    },
    {
      title: t("footer.resources.title"),
      items: [
        { label: t("footer.resources.help_center"), href: "#" },
        { label: t("footer.resources.client_guide"), href: "#" },
        { label: t("footer.resources.contractor_guide"), href: "#" },
        { label: t("footer.resources.faq"), href: "#" },
      ],
    },
    {
      title: t("footer.legal.title"),
      items: [
        { label: t("footer.legal.terms"), href: "#" },
        { label: t("footer.legal.privacy"), href: "/privacy-policy" },
        { label: t("footer.legal.cookies"), href: "#" },
        { label: t("footer.legal.compliance"), href: "/privacy-policy" },
      ],
    },
  ];

  return (
    <footer className="bg-[hsl(var(--navy-deep))] text-white/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-12 lg:gap-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-5">
            <Logo size={34} onDark />
            <p className="mt-5 max-w-[300px] text-sm leading-relaxed text-white/60">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.1em] text-white/50">
              <span>Québec, Canada</span>
              <span>RBQ certifié</span>
            </div>
          </div>

          {columns.map(({ title, items }) => (
            <div key={title} className="col-span-1 md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-white/50">{title}</h3>
              <ul className="mt-4 space-y-3">
                {items.map(({ label, href }) => {
                  const isInternal = href.startsWith("/");
                  const content = (
                    <span className="group inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white">
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  );
                  return (
                    <li key={label}>
                      {isInternal ? (
                        <Link to={href}>{content}</Link>
                      ) : (
                        <a href={href}>{content}</a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 pb-safe sm:flex-row">
          <p className="text-xs text-white/50">© {currentYear} BâtirNet. {t("footer.rights")}</p>
          <p className="text-xs text-white/40">{t("footer.made_with_love")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
