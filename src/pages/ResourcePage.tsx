import { ArrowRight, BookOpen, Building2, CircleHelp, Cookie, FileCheck2, Mail, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export type ResourcePageKind =
  | "about"
  | "careers"
  | "blog"
  | "contact"
  | "help"
  | "client-guide"
  | "professional-guide"
  | "faq"
  | "cookies"
  | "compliance";

interface ResourcePageProps {
  kind: ResourcePageKind;
}

const content: Record<ResourcePageKind, {
  eyebrow: string;
  title: string;
  intro: string;
  icon: typeof Building2;
  sections: Array<{ title: string; body: string }>;
  cta?: { label: string; href: string };
}> = {
  about: {
    eyebrow: "À propos",
    title: "Un espace commun pour mieux organiser les projets de construction",
    intro: "BâtirNet rapproche les clients et les professionnels du Québec dans une expérience simple : trouver, échanger, documenter et suivre un projet depuis un seul endroit.",
    icon: Building2,
    sections: [
      { title: "Notre rôle", body: "Faciliter la mise en relation et réduire les échanges dispersés entre courriels, messages et documents séparés." },
      { title: "Notre approche", body: "Des parcours clairs, des profils professionnels utiles et des outils de projet conçus pour rester faciles à comprendre." },
      { title: "Ce que BâtirNet ne remplace pas", body: "La plateforme aide à organiser la relation entre les parties. Les décisions, vérifications et ententes finales demeurent sous la responsabilité des utilisateurs." },
    ],
    cta: { label: "Découvrir les professionnels", href: "/professionals" },
  },
  careers: {
    eyebrow: "Carrières",
    title: "Construire BâtirNet avec nous",
    intro: "Nous n'affichons aucune offre ouverte pour le moment. Cette page restera le point de référence pour les futures occasions.",
    icon: Users,
    sections: [
      { title: "Produit", body: "Nous cherchons à bâtir une expérience utile, rapide et claire pour les propriétaires comme pour les professionnels." },
      { title: "Technologie", body: "Notre priorité est une plateforme fiable, sécuritaire, accessible et simple à faire évoluer." },
    ],
    cta: { label: "Nous contacter", href: "/contact" },
  },
  blog: {
    eyebrow: "Blogue",
    title: "Conseils et nouveautés BâtirNet",
    intro: "Le blogue est en préparation. Les prochains contenus porteront sur la préparation d'un projet, la comparaison des propositions et l'organisation du suivi.",
    icon: BookOpen,
    sections: [
      { title: "Préparer un projet", body: "Définir le besoin, le budget, l'échéancier et les informations à fournir avant de contacter des professionnels." },
      { title: "Comparer plus clairement", body: "Comprendre les éléments importants d'une proposition et garder une trace structurée des échanges." },
    ],
    cta: { label: "Publier un projet", href: "/dashboard/new-project" },
  },
  contact: {
    eyebrow: "Contact",
    title: "Besoin d'aide avec BâtirNet ?",
    intro: "Utilisez l'adresse de soutien affichée dans votre compte ou le centre d'aide pour les questions liées à votre utilisation de la plateforme.",
    icon: Mail,
    sections: [
      { title: "Question sur votre compte", body: "Consultez d'abord le centre d'aide. Il couvre les parcours principaux pour les clients et les professionnels." },
      { title: "Question sur un projet ou un contrat", body: "Gardez les informations du projet à portée de main afin de pouvoir identifier rapidement l'élément concerné." },
    ],
    cta: { label: "Ouvrir le centre d'aide", href: "/help" },
  },
  help: {
    eyebrow: "Centre d'aide",
    title: "Les réponses essentielles pour avancer rapidement",
    intro: "Retrouvez les parcours principaux de BâtirNet sans devoir chercher dans plusieurs pages.",
    icon: CircleHelp,
    sections: [
      { title: "Je suis client", body: "Publiez un projet, recherchez un professionnel, échangez dans la messagerie puis consultez vos contrats et l'avancement depuis votre tableau de bord." },
      { title: "Je suis professionnel", body: "Complétez votre profil, explorez les projets, envoyez vos propositions et centralisez votre suivi dans l'espace professionnel." },
      { title: "Contrats et documents", body: "Les contrats associés à votre compte sont accessibles depuis la page Contrats. Une liste vide est un état normal lorsqu'aucun contrat n'a encore été créé." },
    ],
    cta: { label: "Voir la FAQ", href: "/faq" },
  },
  "client-guide": {
    eyebrow: "Guide client",
    title: "De l'idée au suivi du projet",
    intro: "Un parcours simple pour préparer votre demande et garder vos informations organisées.",
    icon: FileCheck2,
    sections: [
      { title: "1. Décrivez votre projet", body: "Ajoutez un titre clair, le type de travaux, la région, votre échéancier et les informations qui aideront un professionnel à comprendre le besoin." },
      { title: "2. Trouvez les bons profils", body: "Utilisez la recherche par service et région, consultez les profils et démarrez une conversation lorsque vous souhaitez en savoir plus." },
      { title: "3. Suivez les prochaines étapes", body: "Conservez vos messages, contrats et informations importantes dans BâtirNet afin de limiter les oublis." },
    ],
    cta: { label: "Créer un projet", href: "/dashboard/new-project" },
  },
  "professional-guide": {
    eyebrow: "Guide professionnel",
    title: "Présenter votre entreprise et gérer vos occasions",
    intro: "BâtirNet vous aide à rendre votre offre plus lisible et à centraliser le suivi avec vos clients.",
    icon: Building2,
    sections: [
      { title: "1. Complétez votre profil", body: "Présentez votre entreprise, vos services, votre secteur d'activité, votre expérience et des informations utiles pour les clients." },
      { title: "2. Explorez les projets", body: "Repérez les demandes qui correspondent à vos services et à votre région, puis utilisez la messagerie pour clarifier le besoin." },
      { title: "3. Organisez votre suivi", body: "Retrouvez propositions, contrats, projets et échanges dans votre espace professionnel." },
    ],
    cta: { label: "Accéder à l'espace professionnel", href: "/pro/dashboard" },
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes",
    intro: "Les réponses aux questions les plus courantes sur le fonctionnement de BâtirNet.",
    icon: CircleHelp,
    sections: [
      { title: "Est-ce que BâtirNet effectue les travaux ?", body: "Non. BâtirNet est une plateforme qui facilite la mise en relation et l'organisation du projet entre clients et professionnels." },
      { title: "Les paiements passent-ils par BâtirNet ?", body: "Non. Les parties s'entendent entre elles pour le paiement. BâtirNet peut servir à consigner et suivre certaines étapes ou statuts associés au projet." },
      { title: "Pourquoi ma liste de contrats est-elle vide ?", body: "Si aucun contrat n'est associé à votre compte, la page affiche simplement un état vide. Cela ne constitue pas une erreur." },
      { title: "Puis-je rechercher par région ?", body: "Oui. La recherche de professionnels permet de filtrer selon le service et la région lorsque ces informations sont disponibles." },
    ],
    cta: { label: "Voir le centre d'aide", href: "/help" },
  },
  cookies: {
    eyebrow: "Cookies",
    title: "Utilisation des cookies et du stockage local",
    intro: "Cette page explique de façon générale pourquoi certaines données techniques peuvent être conservées dans votre navigateur pour faire fonctionner l'expérience BâtirNet.",
    icon: Cookie,
    sections: [
      { title: "Fonctionnement essentiel", body: "Certains éléments techniques sont nécessaires pour maintenir une session, conserver des préférences ou assurer la stabilité de la navigation." },
      { title: "Préférences", body: "Des informations locales peuvent être utilisées pour retenir des choix d'interface, comme la langue ou certains états de navigation." },
      { title: "Protection de vos données", body: "Pour les informations détaillées sur les données personnelles et vos droits, consultez la politique de confidentialité." },
    ],
    cta: { label: "Politique de confidentialité", href: "/privacy-policy" },
  },
  compliance: {
    eyebrow: "Conformité",
    title: "Une utilisation responsable de la plateforme",
    intro: "BâtirNet fournit des outils numériques de mise en relation et de suivi. Les utilisateurs demeurent responsables de leurs vérifications, obligations et ententes applicables à leur projet.",
    icon: ShieldCheck,
    sections: [
      { title: "Informations de profil", body: "Les informations affichées dans un profil servent à faciliter l'évaluation initiale d'un professionnel. Elles ne remplacent pas les vérifications que les parties jugent nécessaires." },
      { title: "Contrats", body: "Les outils contractuels servent à structurer et conserver les informations entre les parties. Chaque utilisateur doit s'assurer que l'entente répond à sa situation." },
      { title: "Confidentialité", body: "Les règles concernant la collecte et le traitement des données sont présentées dans la politique de confidentialité." },
    ],
    cta: { label: "Consulter les conditions", href: "/terms-of-service" },
  },
};

const ResourcePage = ({ kind }: ResourcePageProps) => {
  const page = content[kind];
  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 sm:pt-28">
        <section className="bn-page-hero">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-4xl bn-reveal">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary/70 shadow-sm">
                <Icon className="h-4 w-4" />
                {page.eyebrow}
              </div>
              <h1 className="mt-5 max-w-3xl font-ui text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-primary">{page.title}</h1>
              <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">{page.intro}</p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {page.sections.map((section, index) => (
              <article key={section.title} className="bn-surface bn-card-lift bn-reveal" style={{ animationDelay: `${index * 70}ms` }}>
                <div className="h-1 w-10 rounded-full bg-primary/70 mb-5" />
                <h2 className="font-ui text-lg font-bold text-primary">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.body}</p>
              </article>
            ))}
          </div>

          {page.cta && (
            <div className="mt-10 rounded-[1.5rem] bg-primary px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-[0_20px_50px_-30px_rgba(13,43,69,0.7)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Prochaine étape</p>
                <p className="mt-1 text-lg font-semibold text-white">Continuez directement dans BâtirNet.</p>
              </div>
              <Link to={page.cta.href} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary hover:-translate-y-0.5 transition-transform">
                {page.cta.label}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ResourcePage;
