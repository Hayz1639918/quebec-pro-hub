import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes.');
  console.error('   Définissez VITE_SUPABASE_URL et une clé (SUPABASE_SERVICE_ROLE_KEY');
  console.error('   pour le seed, ou VITE_SUPABASE_PUBLISHABLE_KEY) avant de lancer ce script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Projets de test réalistes pour le secteur de la construction au Québec
const testProjects = [
  {
    title: 'Rénovation complète de cuisine moderne',
    description: 'Rénovation complète d\'une cuisine avec îlot central, comptoirs en quartz, armoires sur mesure et électroménagers haut de gamme. Installation de plancher de céramique et nouveau système d\'éclairage LED.',
    budget_min: 30000,
    budget_max: 40000,
    city: 'Montréal',
    region: 'Montréal',
    category: 'Cuisine et salle de bain',
    status: 'open',
  },
  {
    title: 'Construction d\'un garage détaché',
    description: 'Construction d\'un garage détaché 20x24 pieds avec porte de garage automatique, électricité, isolation et finition intérieure. Fondation en béton et toiture en bardeaux d\'asphalte.',
    budget_min: 40000,
    budget_max: 50000,
    city: 'Laval',
    region: 'Laval',
    category: 'Construction neuve',
    status: 'open',
  },
  {
    title: 'Réfection de toiture résidentielle',
    description: 'Remplacement complet de la toiture d\'une maison unifamiliale (2000 pi²). Retrait de l\'ancienne couverture, installation de membrane pare-vapeur et pose de bardeaux architecturaux garantie 30 ans.',
    budget_min: 10000,
    budget_max: 14000,
    city: 'Québec',
    region: 'Québec',
    category: 'Toiture',
    status: 'open',
  },
  {
    title: 'Aménagement de sous-sol complet',
    description: 'Transformation d\'un sous-sol en espace habitable avec 2 chambres, salle de bain complète, salle familiale et buanderie. Isolation, gypse, plancher flottant, électricité et plomberie.',
    budget_min: 50000,
    budget_max: 60000,
    city: 'Longueuil',
    region: 'Montérégie',
    category: 'Rénovation résidentielle',
    status: 'open',
  },
  {
    title: 'Installation de piscine creusée',
    description: 'Installation d\'une piscine creusée en fibre de verre 16x32 pieds avec système de filtration au sel, patio en pavé uni et clôture de sécurité conforme aux normes québécoises.',
    budget_min: 70000,
    budget_max: 80000,
    city: 'Brossard',
    region: 'Montérégie',
    category: 'Paysagement',
    status: 'open',
  },
  {
    title: 'Rénovation de salle de bain luxueuse',
    description: 'Rénovation haut de gamme d\'une salle de bain principale avec douche à l\'italienne, bain autoportant, double vanité, plancher chauffant et robinetterie de luxe. Céramique grand format et éclairage moderne.',
    budget_min: 25000,
    budget_max: 32000,
    city: 'Saint-Laurent',
    region: 'Montréal',
    category: 'Cuisine et salle de bain',
    status: 'open',
  },
  {
    title: 'Extension de maison - Agrandissement',
    description: 'Agrandissement de 400 pi² au rez-de-chaussée pour créer une grande cuisine familiale ouverte sur le salon. Fondation, structure, toiture, électricité, plomberie et finitions complètes.',
    budget_min: 90000,
    budget_max: 100000,
    city: 'Terrebonne',
    region: 'Lanaudière',
    category: 'Construction neuve',
    status: 'open',
  },
  {
    title: 'Isolation et efficacité énergétique',
    description: 'Amélioration de l\'efficacité énergétique d\'une maison avec isolation de l\'entre-toit (R-60), des murs extérieurs et du vide sanitaire. Remplacement de 12 fenêtres Energy Star et calfeutrage complet.',
    budget_min: 28000,
    budget_max: 36000,
    city: 'Repentigny',
    region: 'Lanaudière',
    category: 'Isolation',
    status: 'open',
  },
  {
    title: 'Aménagement paysager complet',
    description: 'Aménagement paysager résidentiel avec patio en pierre naturelle, muret de soutènement, plantation d\'arbres et arbustes, système d\'irrigation automatique et éclairage extérieur.',
    budget_min: 20000,
    budget_max: 25000,
    city: 'Blainville',
    region: 'Laurentides',
    category: 'Paysagement',
    status: 'open',
  },
  {
    title: 'Mise aux normes électriques complète',
    description: 'Remplacement complet du panneau électrique 200 ampères, mise à jour du filage en cuivre, installation de prises GFCI dans cuisine et salles de bain, détecteurs de fumée interconnectés conformes au Code.',
    budget_min: 7000,
    budget_max: 10000,
    city: 'Saint-Jean-sur-Richelieu',
    region: 'Montérégie',
    category: 'Électricité',
    status: 'open',
  },
  {
    title: 'Construction de terrasse extérieure',
    description: 'Construction d\'une terrasse en composite (Trex) de 400 pi² avec deux niveaux, rampe en aluminium, éclairage intégré et escalier vers la cour. Pergola attachée pour zone ombragée.',
    budget_min: 16000,
    budget_max: 20000,
    city: 'Mirabel',
    region: 'Laurentides',
    category: 'Menuiserie',
    status: 'open',
  },
  {
    title: 'Remplacement de revêtement extérieur',
    description: 'Remplacement du revêtement extérieur en vinyle vieillissant par du canexel avec isolation ajoutée. Installation de nouvelles soffites et fascias en aluminium. Surface totale: 2500 pi².',
    budget_min: 22000,
    budget_max: 28000,
    city: 'Mascouche',
    region: 'Lanaudière',
    category: 'Rénovation résidentielle',
    status: 'open',
  },
];

async function seedProjects() {
  console.log('🌱 Début du seed des projets de test...\n');

  try {
    // Récupérer un client pour assigner les projets
    const { data: clients, error: clientError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('user_type', 'client')
      .limit(1);

    if (clientError) {
      console.error('❌ Erreur lors de la récupération des clients:', clientError);
      return;
    }

    if (!clients || clients.length === 0) {
      console.log('⚠️  Aucun client trouvé. Veuillez créer au moins un compte client d\'abord.');
      return;
    }

    const clientId = clients[0].id;
    console.log(`✅ Client trouvé: ${clients[0].full_name} (${clientId})\n`);

    // Insérer les projets de test
    let successCount = 0;
    let errorCount = 0;

    for (const project of testProjects) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          client_id: clientId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur pour "${project.title}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Projet créé: ${project.title}`);
        successCount++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ ${successCount} projets créés avec succès`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} erreurs`);
    }
    console.log(`\n🎉 Seed terminé !`);

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

// Exécuter le script
seedProjects();
