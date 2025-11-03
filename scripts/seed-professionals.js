#!/usr/bin/env node

/**
 * Script de seed pour créer des professionnels de démonstration
 * 
 * Usage:
 * 1. npm install @supabase/supabase-js
 * 2. node scripts/seed-professionals.js
 * 
 * Assurez-vous d'avoir les variables d'environnement:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

// Récupérer les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL ou SUPABASE_URL manquant')
  console.log('💡 Ajoutez VITE_SUPABASE_URL=https://votre-projet.supabase.co dans votre .env')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant')
  console.log('💡 Ajoutez SUPABASE_SERVICE_ROLE_KEY=votre-cle-service dans votre .env')
  console.log('🔑 Trouvez votre clé dans Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Default password for seeded users (DEVELOPMENT ONLY - change in production!)
const SEED_DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Test123!'

const professionals = [
  {
    email: 'jean.tremblay@batirnet.com',
    password: SEED_DEFAULT_PASSWORD,
    full_name: 'Jean Tremblay',
    phone: '514-555-0101',
    company_name: 'Construction Tremblay Inc.',
    rbq_number: '5678-1234-01',
    services_offered: 'Construction générale, Rénovation, Agrandissement',
    insurance_info: 'Assurance responsabilité: 2M$',
    city: 'Montréal',
    region: 'Montréal',
    bio: 'Expert en construction résidentielle avec 25 ans d\'expérience. Spécialisé dans les projets de rénovation majeure et d\'agrandissement.',
    years_experience: 25,
    average_rating: 4.8,
    total_reviews: 47,
    total_projects: 156,
    hourly_rate_min: 75.00,
    hourly_rate_max: 125.00,
    availability_status: 'available',
    response_time_hours: 12,
    accepts_small_projects: true,
    minimum_project_budget: 5000,
    travel_distance_km: 50,
    latitude: 45.5017,
    longitude: -73.5673,
    activity_score: 92.5,
    total_proposals_sent: 234,
    proposals_last_30_days: 18,
    profile_views_count: 1203
  },
  {
    email: 'marie.leblanc@batirnet.com',
    password: 'Test123!',
    full_name: 'Marie Leblanc',
    phone: '514-555-0102',
    company_name: 'Électricité Leblanc',
    rbq_number: '5678-2345-01',
    services_offered: 'Électricité résidentielle, Domotique, Installation bornes électriques',
    insurance_info: 'Assurance RBQ: 1M$',
    city: 'Laval',
    region: 'Laval',
    bio: 'Maître électricienne certifiée. Spécialiste en domotique et installation de bornes de recharge.',
    years_experience: 15,
    average_rating: 4.9,
    total_reviews: 89,
    total_projects: 203,
    hourly_rate_min: 65.00,
    hourly_rate_max: 95.00,
    availability_status: 'available',
    response_time_hours: 6,
    accepts_small_projects: true,
    minimum_project_budget: 1000,
    travel_distance_km: 75,
    latitude: 45.6066,
    longitude: -73.7124,
    activity_score: 88.3,
    total_proposals_sent: 156,
    proposals_last_30_days: 12,
    profile_views_count: 892
  },
  {
    email: 'pierre.gagnon@batirnet.com',
    password: 'Test123!',
    full_name: 'Pierre Gagnon',
    phone: '514-555-0103',
    company_name: 'Plomberie Gagnon & Fils',
    rbq_number: '5678-3456-01',
    services_offered: 'Plomberie, Chauffage, Climatisation',
    insurance_info: 'Assurance responsabilité: 1.5M$',
    city: 'Longueuil',
    region: 'Montérégie',
    bio: 'Entreprise familiale depuis 40 ans. Service rapide et garantie sur tous les travaux.',
    years_experience: 20,
    average_rating: 4.7,
    total_reviews: 134,
    total_projects: 312,
    hourly_rate_min: 60.00,
    hourly_rate_max: 90.00,
    availability_status: 'busy',
    response_time_hours: 24,
    accepts_small_projects: true,
    minimum_project_budget: 800,
    travel_distance_km: 60,
    latitude: 45.5312,
    longitude: -73.5182,
    activity_score: 75.2,
    total_proposals_sent: 289,
    proposals_last_30_days: 8,
    profile_views_count: 1456
  },
  {
    email: 'luc.belanger@batirnet.com',
    password: 'Test123!',
    full_name: 'Luc Bélanger',
    phone: '514-555-0104',
    company_name: 'Toitures Bélanger',
    rbq_number: '5678-4567-01',
    services_offered: 'Toiture résidentielle, Toiture commerciale, Membrane élastomère',
    insurance_info: 'Assurance RBQ: 2M$',
    city: 'Brossard',
    region: 'Montérégie',
    bio: 'Spécialiste en toiture depuis 18 ans. Garantie 10 ans sur main d\'œuvre.',
    years_experience: 18,
    average_rating: 4.6,
    total_reviews: 98,
    total_projects: 187,
    hourly_rate_min: 70.00,
    hourly_rate_max: 110.00,
    availability_status: 'available',
    response_time_hours: 18,
    accepts_small_projects: false,
    minimum_project_budget: 8000,
    travel_distance_km: 100,
    latitude: 45.4672,
    longitude: -73.4496,
    activity_score: 82.7,
    total_proposals_sent: 167,
    proposals_last_30_days: 15,
    profile_views_count: 723
  },
  {
    email: 'sophie.martin@batirnet.com',
    password: 'Test123!',
    full_name: 'Sophie Martin',
    phone: '514-555-0105',
    company_name: 'Paysages Sophie Martin',
    rbq_number: '5678-5678-01',
    services_offered: 'Paysagement, Aménagement extérieur, Pavé uni',
    insurance_info: 'Assurance responsabilité: 1M$',
    city: 'Saint-Laurent',
    region: 'Montréal',
    bio: 'Architecte paysagiste diplômée. Création d\'espaces extérieurs uniques et durables.',
    years_experience: 12,
    average_rating: 4.9,
    total_reviews: 76,
    total_projects: 124,
    hourly_rate_min: 55.00,
    hourly_rate_max: 85.00,
    availability_status: 'available',
    response_time_hours: 8,
    accepts_small_projects: true,
    minimum_project_budget: 3000,
    travel_distance_km: 80,
    latitude: 45.5088,
    longitude: -73.6789,
    activity_score: 86.4,
    total_proposals_sent: 134,
    proposals_last_30_days: 11,
    profile_views_count: 567
  },
  {
    email: 'francois.roy@batirnet.com',
    password: 'Test123!',
    full_name: 'François Roy',
    phone: '514-555-0106',
    company_name: 'Menuiserie Roy',
    rbq_number: '5678-6789-01',
    services_offered: 'Menuiserie, Armoires sur mesure, Escaliers',
    insurance_info: 'Assurance RBQ: 1M$',
    city: 'Repentigny',
    region: 'Lanaudière',
    bio: 'Ébéniste et menuisier passionné. Travail artisanal de haute qualité.',
    years_experience: 22,
    average_rating: 4.8,
    total_reviews: 112,
    total_projects: 189,
    hourly_rate_min: 65.00,
    hourly_rate_max: 100.00,
    availability_status: 'available',
    response_time_hours: 12,
    accepts_small_projects: true,
    minimum_project_budget: 2000,
    travel_distance_km: 70,
    latitude: 45.7423,
    longitude: -73.4501,
    activity_score: 79.8,
    total_proposals_sent: 198,
    proposals_last_30_days: 14,
    profile_views_count: 892
  },
  {
    email: 'isabelle.cote@batirnet.com',
    password: 'Test123!',
    full_name: 'Isabelle Côté',
    phone: '514-555-0107',
    company_name: 'Peinture Isabelle Côté',
    rbq_number: '5678-7890-01',
    services_offered: 'Peinture intérieure, Peinture extérieure, Finition',
    insurance_info: 'Assurance responsabilité: 500K$',
    city: 'Terrebonne',
    region: 'Lanaudière',
    bio: 'Service de peinture résidentielle et commerciale. Minutieuse et professionnelle.',
    years_experience: 10,
    average_rating: 4.7,
    total_reviews: 64,
    total_projects: 143,
    hourly_rate_min: 45.00,
    hourly_rate_max: 70.00,
    availability_status: 'available',
    response_time_hours: 10,
    accepts_small_projects: true,
    minimum_project_budget: 1500,
    travel_distance_km: 60,
    latitude: 45.7010,
    longitude: -73.6470,
    activity_score: 73.5,
    total_proposals_sent: 112,
    proposals_last_30_days: 9,
    profile_views_count: 445
  },
  {
    email: 'robert.tremblay@batirnet.com',
    password: 'Test123!',
    full_name: 'Robert Tremblay',
    phone: '514-555-0108',
    company_name: 'Excavation R. Tremblay',
    rbq_number: '5678-8901-01',
    services_offered: 'Excavation, Fondations, Drainage',
    insurance_info: 'Assurance RBQ: 3M$',
    city: 'Laval',
    region: 'Laval',
    bio: 'Excavation et fondations pour projets résidentiels. Équipement moderne.',
    years_experience: 28,
    average_rating: 4.6,
    total_reviews: 91,
    total_projects: 167,
    hourly_rate_min: 85.00,
    hourly_rate_max: 130.00,
    availability_status: 'busy',
    response_time_hours: 24,
    accepts_small_projects: false,
    minimum_project_budget: 15000,
    travel_distance_km: 100,
    latitude: 45.5897,
    longitude: -73.7103,
    activity_score: 68.9,
    total_proposals_sent: 201,
    proposals_last_30_days: 6,
    profile_views_count: 934
  },
  {
    email: 'caroline.bouchard@batirnet.com',
    password: 'Test123!',
    full_name: 'Caroline Bouchard',
    phone: '514-555-0109',
    company_name: 'Design Intérieur CB',
    rbq_number: '5678-9012-01',
    services_offered: 'Design intérieur, Consultation, Plans 3D',
    insurance_info: 'Assurance professionnelle: 1M$',
    city: 'Montréal',
    region: 'Montréal',
    bio: 'Designer d\'intérieur primée. Création d\'espaces fonctionnels et esthétiques.',
    years_experience: 14,
    average_rating: 4.9,
    total_reviews: 87,
    total_projects: 156,
    hourly_rate_min: 75.00,
    hourly_rate_max: 150.00,
    availability_status: 'available',
    response_time_hours: 6,
    accepts_small_projects: true,
    minimum_project_budget: 2500,
    travel_distance_km: 50,
    latitude: 45.5236,
    longitude: -73.5875,
    activity_score: 91.2,
    total_proposals_sent: 178,
    proposals_last_30_days: 16,
    profile_views_count: 689
  },
  {
    email: 'martin.lavoie@batirnet.com',
    password: 'Test123!',
    full_name: 'Martin Lavoie',
    phone: '514-555-0110',
    company_name: 'Chauffage Lavoie',
    rbq_number: '5678-0123-01',
    services_offered: 'Thermopompe, Climatisation, Chauffage, Ventilation',
    insurance_info: 'Assurance RBQ: 2M$',
    city: 'Boucherville',
    region: 'Montérégie',
    bio: 'Expert en systèmes CVAC. Installation et entretien de thermopompes.',
    years_experience: 16,
    average_rating: 4.8,
    total_reviews: 103,
    total_projects: 198,
    hourly_rate_min: 70.00,
    hourly_rate_max: 105.00,
    availability_status: 'available',
    response_time_hours: 12,
    accepts_small_projects: true,
    minimum_project_budget: 3000,
    travel_distance_km: 80,
    latitude: 45.5942,
    longitude: -73.4416,
    activity_score: 84.6,
    total_proposals_sent: 189,
    proposals_last_30_days: 13,
    profile_views_count: 812
  }
]

async function createProfessional(pro) {
  try {
    console.log(`🔄 Création du professionnel: ${pro.full_name}...`)

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: pro.email,
      password: pro.password,
      email_confirm: true, // Confirme l'email automatiquement
    })

    if (authError) {
      console.error(`❌ Erreur Auth pour ${pro.email}:`, authError.message)
      return false
    }

    console.log(`✅ Utilisateur créé: ${authData.user.id}`)

    // 2. Créer le profil professionnel
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: pro.email,
        full_name: pro.full_name,
        phone: pro.phone,
        user_type: 'professional',
        company_name: pro.company_name,
        rbq_number: pro.rbq_number,
        services_offered: pro.services_offered,
        insurance_info: pro.insurance_info,
        is_rbq_verified: true,
        city: pro.city,
        region: pro.region,
        bio: pro.bio,
        years_experience: pro.years_experience,
        average_rating: pro.average_rating,
        total_reviews: pro.total_reviews,
        total_projects: pro.total_projects,
        // Nouveaux champs pour filtres
        hourly_rate_min: pro.hourly_rate_min,
        hourly_rate_max: pro.hourly_rate_max,
        availability_status: pro.availability_status,
        response_time_hours: pro.response_time_hours,
        accepts_small_projects: pro.accepts_small_projects,
        minimum_project_budget: pro.minimum_project_budget,
        travel_distance_km: pro.travel_distance_km,
        // Géolocalisation
        latitude: pro.latitude,
        longitude: pro.longitude,
        location_last_updated: new Date().toISOString(),
        // Métriques d'activité
        last_active_at: new Date().toISOString(),
        activity_score: pro.activity_score,
        total_proposals_sent: pro.total_proposals_sent,
        proposals_last_30_days: pro.proposals_last_30_days,
        profile_views_count: pro.profile_views_count,
      })

    if (profileError) {
      console.error(`❌ Erreur Profil pour ${pro.email}:`, profileError.message)
      return false
    }

    console.log(`✅ Profil créé: ${pro.company_name}`)
    return true

  } catch (error) {
    console.error(`❌ Erreur générale pour ${pro.email}:`, error.message)
    return false
  }
}

async function seedProfessionals() {
  console.log('🚀 Début du seed des professionnels...\n')

  let successCount = 0
  let errorCount = 0

  for (const pro of professionals) {
    const success = await createProfessional(pro)
    if (success) {
      successCount++
    } else {
      errorCount++
    }
    console.log('') // Ligne vide pour la lisibilité
  }

  console.log('📊 Résumé du seed:')
  console.log(`✅ Succès: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`📝 Total: ${professionals.length}`)

  if (successCount > 0) {
    console.log('\n🎉 Professionnels créés avec succès!')
    console.log('Vous pouvez maintenant tester:')
    console.log('- /professionals (voir les cartes)')
    console.log('- Filtres par budget, disponibilité, proximité')
    console.log('- Tri par activité, proximité, note')
    console.log('- Bouton "Contacter" pour créer des conversations')
  }
}

// Les variables d'environnement sont déjà vérifiées plus haut

// Exporter la fonction pour pouvoir l'importer
export default seedProfessionals

// Exécuter le seed si le script est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProfessionals().catch(console.error)
}
