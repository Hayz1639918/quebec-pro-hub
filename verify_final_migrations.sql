-- Script de vérification finale après application des migrations
-- Exécuter ce script dans Supabase SQL Editor pour confirmer que tout est en place

-- ========================================
-- VÉRIFICATION FINALE - RÉSUMÉ COMPLET
-- ========================================

-- Test 1: Compter les tables principales
SELECT 
  'TABLES PRINCIPALES' as category,
  COUNT(*) as count,
  string_agg(table_name, ', ' ORDER BY table_name) as items
FROM information_schema.tables 
WHERE table_name IN (
  'profiles', 'projects', 'contracts', 'contract_templates', 'contract_audit_trail',
  'subscriptions', 'contract_milestones', 'subcontractors', 'subcontractor_tasks',
  'reviews', 'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
)

UNION ALL

-- Test 2: Compter les types ENUM
SELECT 
  'TYPES ENUM' as category,
  COUNT(DISTINCT typname) as count,
  string_agg(DISTINCT typname, ', ' ORDER BY typname) as items
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN (
  'user_type', 'project_status', 'contract_status', 'subscription_plan', 'subscription_status',
  'milestone_status', 'subcontractor_status', 'task_status', 'mediation_status',
  'contract_proposal_status', 'notification_type', 'message_status'
)

UNION ALL

-- Test 3: Compter les fonctions importantes
SELECT 
  'FONCTIONS' as category,
  COUNT(*) as count,
  string_agg(routine_name, ', ' ORDER BY routine_name) as items
FROM information_schema.routines 
WHERE routine_name IN (
  'get_contract_audit_trail', 'add_audit_trail_entry', 'validate_professional_subscription',
  'notify_compliance_expiry', 'accept_contract_proposal', 'validate_contract_proposal_users',
  'approve_milestone'
)

UNION ALL

-- Test 4: Compter les triggers
SELECT 
  'TRIGGERS' as category,
  COUNT(*) as count,
  string_agg(trigger_name, ', ' ORDER BY trigger_name) as items
FROM information_schema.triggers 
WHERE trigger_name IN (
  'update_updated_at_column', 'validate_professional_subscription_trigger',
  'validate_contract_proposal_users_trigger'
)

UNION ALL

-- Test 5: Compter les index principaux
SELECT 
  'INDEX PRINCIPAUX' as category,
  COUNT(*) as count,
  string_agg(indexname, ', ' ORDER BY indexname) as items
FROM pg_indexes 
WHERE indexname IN (
  'idx_profiles_user_type', 'idx_projects_status', 'idx_contracts_status',
  'idx_audit_trail_created_at', 'idx_subscriptions_user', 'idx_milestones_contract',
  'idx_subcontractors_owner', 'idx_tasks_subcontractor', 'idx_reviews_professional',
  'idx_mediations_status', 'idx_cp_status'
)

UNION ALL

-- Test 6: Compter les tables avec RLS activé
SELECT 
  'TABLES AVEC RLS' as category,
  COUNT(*) as count,
  string_agg(tablename, ', ' ORDER BY tablename) as items
FROM pg_tables 
WHERE tablename IN (
  'profiles', 'projects', 'contracts', 'contract_audit_trail', 'subscriptions',
  'contract_milestones', 'subcontractors', 'subcontractor_tasks', 'reviews',
  'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
)
AND rowsecurity = true;

-- ========================================
-- VÉRIFICATION DES ÉLÉMENTS MANQUANTS
-- ========================================

-- Vérifier s'il y a des éléments manquants
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles', 'projects', 'contracts', 'contract_templates', 'contract_audit_trail',
    'subscriptions', 'contract_milestones', 'subcontractors', 'subcontractor_tasks',
    'reviews', 'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
  ]) as table_name
),
existing_tables AS (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
),
missing_tables AS (
  SELECT et.table_name
  FROM expected_tables et
  LEFT JOIN existing_tables ext ON et.table_name = ext.table_name
  WHERE ext.table_name IS NULL
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TOUTES LES TABLES SONT PRÉSENTES'
    ELSE '❌ TABLES MANQUANTES: ' || string_agg(table_name, ', ')
  END as table_status
FROM missing_tables;

-- ========================================
-- STATUT FINAL
-- ========================================

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_name IN (
        'profiles', 'projects', 'contracts', 'contract_templates', 'contract_audit_trail',
        'subscriptions', 'contract_milestones', 'subcontractors', 'subcontractor_tasks',
        'reviews', 'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
      )
    ) = 15
    THEN '🎉 TOUTES LES MIGRATIONS ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS!'
    ELSE '⚠️ CERTAINES MIGRATIONS SONT MANQUANTES'
  END as final_status;
