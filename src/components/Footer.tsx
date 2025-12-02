import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
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
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-6 sm:mb-8 md:mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 sm:mb-6">
              <img 
                src={logo} 
                alt="BâtirNet Logo" 
                className="h-12 sm:h-14 md:h-16 w-auto object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary active:text-primary/80 transition-colors p-1 touch-target">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary active:text-primary/80 transition-colors p-1 touch-target">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary active:text-primary/80 transition-colors p-1 touch-target">
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary active:text-primary/80 transition-colors p-1 touch-target">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t('footer.company.title')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {links.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-xs sm:text-sm md:text-base text-muted-foreground hover:text-primary active:text-primary/80 transition-colors py-1 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t('footer.resources.title')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {links.resources.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-xs sm:text-sm md:text-base text-muted-foreground hover:text-primary active:text-primary/80 transition-colors py-1 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">{t('footer.legal.title')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-xs sm:text-sm md:text-base text-muted-foreground hover:text-primary active:text-primary/80 transition-colors py-1 inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-border pb-safe">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-4">
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} BâtirNet. {t('footer.rights')}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground text-center md:text-right">
              {t('footer.made_with_love')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
