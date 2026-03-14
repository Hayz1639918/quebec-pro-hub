// Liste normalisée des métiers de la construction CCQ/RBQ (Québec)
// Source: Commission de la construction du Québec (CCQ) & Régie du bâtiment du Québec (RBQ)

export interface CCQTrade {
  code: string;
  name_fr: string;
  name_en: string;
  category: 'electricite' | 'mecanique' | 'structure' | 'finition' | 'genie_civil' | 'specialise';
  badge_color: string;
}

export const CCQ_TRADES: CCQTrade[] = [
  // Électricité
  {
    code: 'ELEC',
    name_fr: 'Électricien de construction',
    name_en: 'Construction Electrician',
    category: 'electricite',
    badge_color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  {
    code: 'LINE',
    name_fr: 'Lineman (électricité de puissance)',
    name_en: 'Lineman (Power Electrician)',
    category: 'electricite',
    badge_color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  // Mécanique du bâtiment
  {
    code: 'PLOM',
    name_fr: 'Plombier',
    name_en: 'Plumber',
    category: 'mecanique',
    badge_color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    code: 'CHAU',
    name_fr: 'Chauffagiste',
    name_en: 'Heating Mechanic',
    category: 'mecanique',
    badge_color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    code: 'FRIGO',
    name_fr: 'Frigoriste (CVAC)',
    name_en: 'Refrigeration Mechanic (HVAC)',
    category: 'mecanique',
    badge_color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    code: 'FERB',
    name_fr: 'Ferblantier',
    name_en: 'Sheet Metal Worker',
    category: 'mecanique',
    badge_color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    code: 'TUYAU',
    name_fr: 'Tuyauteur',
    name_en: 'Pipefitter',
    category: 'mecanique',
    badge_color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    code: 'CALOR',
    name_fr: 'Calorifugeur',
    name_en: 'Insulator (Mechanical Systems)',
    category: 'mecanique',
    badge_color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  // Structure
  {
    code: 'CHARP',
    name_fr: 'Charpentier-menuisier',
    name_en: 'Carpenter',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    code: 'MACON',
    name_fr: 'Maçon',
    name_en: 'Mason',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    code: 'BRIQU',
    name_fr: 'Briqueteur-maçon',
    name_en: 'Bricklayer',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    code: 'SOUDB',
    name_fr: 'Soudeur (structure)',
    name_en: 'Welder (Structural)',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    code: 'MMECA',
    name_fr: 'Monteur-mécanicien (structures d\'acier)',
    name_en: 'Steel Erector (Ironworker)',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    code: 'ASCAR',
    name_fr: 'Monteur-mécanicien (ascenseurs)',
    name_en: 'Elevator Mechanic',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    code: 'COUV',
    name_fr: 'Couvreur',
    name_en: 'Roofer',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    code: 'REFR',
    name_fr: 'Réfractoriste',
    name_en: 'Refractory Bricklayer',
    category: 'structure',
    badge_color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  // Finition
  {
    code: 'PEIN',
    name_fr: 'Peintre',
    name_en: 'Painter',
    category: 'finition',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    code: 'PLAT',
    name_fr: 'Plâtrier',
    name_en: 'Plasterer',
    category: 'finition',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    code: 'CARRE',
    name_fr: 'Carreleur',
    name_en: 'Tile Setter',
    category: 'finition',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    code: 'REVS',
    name_fr: 'Poseur de revêtements souples',
    name_en: 'Floor Covering Installer',
    category: 'finition',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    code: 'ISOLB',
    name_fr: 'Poseur d\'isolant en bâtiment',
    name_en: 'Building Insulation Installer',
    category: 'finition',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    code: 'VITRIER',
    name_fr: 'Vitrier',
    name_en: 'Glazier',
    category: 'finition',
    badge_color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  // Génie civil
  {
    code: 'EXCAV',
    name_fr: 'Opérateur d\'équipement lourd',
    name_en: 'Heavy Equipment Operator',
    category: 'genie_civil',
    badge_color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    code: 'GRUT',
    name_fr: 'Grutier',
    name_en: 'Crane Operator',
    category: 'genie_civil',
    badge_color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    code: 'ROUTE',
    name_fr: 'Canalisateur-égoutier',
    name_en: 'Drain Layer',
    category: 'genie_civil',
    badge_color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    code: 'ASPHAL',
    name_fr: 'Poseur d\'asphalte',
    name_en: 'Asphalt Paver',
    category: 'genie_civil',
    badge_color: 'bg-green-100 text-green-800 border-green-300',
  },
  // Spécialisé
  {
    code: 'RENOV',
    name_fr: 'Rénovation générale',
    name_en: 'General Renovation',
    category: 'specialise',
    badge_color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  {
    code: 'DEMOL',
    name_fr: 'Démolition',
    name_en: 'Demolition',
    category: 'specialise',
    badge_color: 'bg-red-100 text-red-800 border-red-300',
  },
  {
    code: 'PORTE',
    name_fr: 'Poseur de portes et fenêtres',
    name_en: 'Door & Window Installer',
    category: 'specialise',
    badge_color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  {
    code: 'ECHAF',
    name_fr: 'Monteur d\'échafaudages',
    name_en: 'Scaffold Builder',
    category: 'specialise',
    badge_color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
];

export const CCQ_CATEGORIES: Record<CCQTrade['category'], { label_fr: string; label_en: string }> = {
  electricite: { label_fr: 'Électricité', label_en: 'Electricity' },
  mecanique:   { label_fr: 'Mécanique du bâtiment', label_en: 'Mechanical' },
  structure:   { label_fr: 'Structure & Gros œuvre', label_en: 'Structure & Framing' },
  finition:    { label_fr: 'Finition & Revêtements', label_en: 'Finishing & Coverings' },
  genie_civil: { label_fr: 'Génie civil', label_en: 'Civil Engineering' },
  specialise:  { label_fr: 'Travaux spécialisés', label_en: 'Specialized Work' },
};

export function getTradeByCode(code: string): CCQTrade | undefined {
  return CCQ_TRADES.find(t => t.code === code);
}
