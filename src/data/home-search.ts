/** Options partagées entre la recherche home et les filtres Professionals */

export type HomeSearchOption = {
  slug: string;
  label: string;
  /** Mots-clés pour matcher services_offered / city / region */
  keywords: string[];
};

export const HOME_SERVICES: HomeSearchOption[] = [
  {
    slug: "renovation",
    label: "Rénovation résidentielle",
    keywords: ["rénovation", "renovation"],
  },
  {
    slug: "construction",
    label: "Construction neuve",
    keywords: ["construction neuve", "construction"],
  },
  {
    slug: "toiture",
    label: "Toiture",
    keywords: ["toiture", "couvreur", "toit"],
  },
  {
    slug: "plomberie",
    label: "Plomberie",
    keywords: ["plomberie", "plombier"],
  },
  {
    slug: "electricite",
    label: "Électricité",
    keywords: ["électricité", "electricite", "électricien", "electricien"],
  },
  {
    slug: "menuiserie",
    label: "Menuiserie",
    keywords: ["menuiserie", "charpentier", "carpentry"],
  },
  {
    slug: "maconnerie",
    label: "Maçonnerie",
    keywords: ["maçonnerie", "maconnerie", "maçon"],
  },
  {
    slug: "peinture",
    label: "Peinture",
    keywords: ["peinture", "peintre"],
  },
  {
    slug: "isolation",
    label: "Isolation",
    keywords: ["isolation", "isolant"],
  },
  {
    slug: "amenagement",
    label: "Aménagement paysager",
    keywords: ["aménagement paysager", "amenagement", "paysager", "paysagiste"],
  },
  {
    slug: "cuisine-salle-de-bain",
    label: "Cuisine et salle de bain",
    keywords: ["cuisine", "salle de bain", "bathroom"],
  },
  {
    slug: "agrandissement",
    label: "Extension et agrandissement",
    keywords: ["agrandissement", "extension"],
  },
];

export const HOME_REGIONS: HomeSearchOption[] = [
  { slug: "montreal", label: "Montréal", keywords: ["montréal", "montreal"] },
  { slug: "quebec", label: "Québec", keywords: ["québec", "quebec"] },
  { slug: "laval", label: "Laval", keywords: ["laval"] },
  { slug: "gatineau", label: "Gatineau", keywords: ["gatineau"] },
  { slug: "longueuil", label: "Longueuil", keywords: ["longueuil"] },
  { slug: "sherbrooke", label: "Sherbrooke", keywords: ["sherbrooke"] },
  { slug: "saguenay", label: "Saguenay", keywords: ["saguenay"] },
  {
    slug: "trois-rivieres",
    label: "Trois-Rivières",
    keywords: ["trois-rivières", "trois-rivieres", "trois rivières"],
  },
  { slug: "terrebonne", label: "Terrebonne", keywords: ["terrebonne"] },
  {
    slug: "saint-jean",
    label: "Saint-Jean-sur-Richelieu",
    keywords: ["saint-jean", "richelieu"],
  },
];

export function findHomeOption(
  options: HomeSearchOption[],
  slugOrLabel: string | null | undefined,
): HomeSearchOption | undefined {
  if (!slugOrLabel) return undefined;
  const key = slugOrLabel.trim().toLowerCase();
  return options.find(
    (o) =>
      o.slug === key ||
      o.label.toLowerCase() === key ||
      o.keywords.some((k) => k === key),
  );
}
