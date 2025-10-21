#!/usr/bin/env node

/**
 * Script simple pour exécuter le seed des professionnels
 * Demande les variables d'environnement si elles ne sont pas définies
 */

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

// Interface pour lire l'input utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

async function getSupabaseConfig() {
  console.log('🚀 Configuration du seed des professionnels\n')
  
  // URL Supabase
  let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  if (!supabaseUrl) {
    supabaseUrl = await askQuestion('🔗 URL de votre projet Supabase (ex: https://gsnjnhxzacwjslirfxgy.supabase.co): ')
  } else {
    console.log(`✅ URL Supabase: ${supabaseUrl}`)
  }

  // Service Role Key
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.log('\n🔑 Clé de service Supabase:')
    console.log('   1. Allez dans Supabase Dashboard > Settings > API')
    console.log('   2. Copiez la "service_role" key (pas la "anon" key)')
    console.log('   3. ⚠️  Cette clé a des privilèges admin, gardez-la secrète!')
    serviceRoleKey = await askQuestion('\n🔐 Collez votre service_role key: ')
  } else {
    console.log('✅ Service Role Key: [MASQUÉE]')
  }

  rl.close()

  return { supabaseUrl, serviceRoleKey }
}

async function main() {
  try {
    const { supabaseUrl, serviceRoleKey } = await getSupabaseConfig()

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Configuration incomplète')
      process.exit(1)
    }

    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('\n🔄 Test de connexion à Supabase...')
    
    // Test de connexion
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message)
      console.log('\n💡 Vérifiez:')
      console.log('   - Que l\'URL Supabase est correcte')
      console.log('   - Que la clé de service est correcte')
      console.log('   - Que les migrations sont appliquées')
      process.exit(1)
    }

    console.log('✅ Connexion réussie!')
    console.log('\n🚀 Lancement du seed...\n')

    // Importer et exécuter le script principal
    const { default: seedProfessionals } = await import('./seed-professionals.js')
    
    // Modifier les variables d'environnement pour le script principal
    process.env.VITE_SUPABASE_URL = supabaseUrl
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey
    
    await seedProfessionals()

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

main()
