-- Script de vérification finale complète
-- Exécuter ce script dans Supabase SQL Editor pour confirmer que toutes les migrations sont appliquées

-- ========================================
-- VÉRIFICATION COMPLÈTE DES MIGRATIONS
-- ========================================

-- Test 1: Compter les tables principales
SELECT 
  'TABLES PRINCIPALES' as category,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 15 THEN '✅ COMPLET'
    ELSE '❌ MANQUANTES: ' || (15 - COUNT(*))
  END as status
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
  CASE 
    WHEN COUNT(DISTINCT typname) = 12 THEN '✅ COMPLET'
    ELSE '❌ MANQUANTES: ' || (12 - COUNT(DISTINCT typname))
  END as status
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
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ COMPLET'
    ELSE '❌ MANQUANTES: ' || (7 - COUNT(*))
  END as status
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
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ COMPLET'
    ELSE '❌ MANQUANTES: ' || (3 - COUNT(*))
  END as status
FROM information_schema.triggers 
WHERE trigger_name IN (
  'update_updated_at_column', 'validate_professional_subscription_trigger',
  'validate_contract_proposal_users_trigger'
)

UNION ALL

-- Test 5: Compter les tables avec RLS activé
SELECT 
  'TABLES AVEC RLS' as category,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 15 THEN '✅ COMPLET'
    ELSE '❌ MANQUANTES: ' || (15 - COUNT(*))
  END as status
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

-- Vérifier s'il y a encore des éléments manquants
WITH missing_items AS (
  -- Tables manquantes
  SELECT 'TABLE MANQUANTE' as type, table_name as item
  FROM (
    SELECT unnest(ARRAY[
      'profiles', 'projects', 'contracts', 'contract_templates', 'contract_audit_trail',
      'subscriptions', 'contract_milestones', 'subcontractors', 'subcontractor_tasks',
      'reviews', 'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
    ]) as table_name
  ) expected
  WHERE table_name NOT IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  )
  
  UNION ALL
  
  -- Types ENUM manquants
  SELECT 'TYPE ENUM MANQUANT' as type, enum_name as item
  FROM (
    SELECT unnest(ARRAY[
      'user_type', 'project_status', 'contract_status', 'subscription_plan', 'subscription_status',
      'milestone_status', 'subcontractor_status', 'task_status', 'mediation_status',
      'contract_proposal_status', 'notification_type', 'message_status'
    ]) as enum_name
  ) expected
  WHERE enum_name NOT IN (
    SELECT DISTINCT typname
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
  )
  
  UNION ALL
  
  -- Fonctions manquantes
  SELECT 'FONCTION MANQUANTE' as type, function_name as item
  FROM (
    SELECT unnest(ARRAY[
      'get_contract_audit_trail', 'add_audit_trail_entry', 'validate_professional_subscription',
      'notify_compliance_expiry', 'accept_contract_proposal', 'validate_contract_proposal_users',
      'approve_milestone'
    ]) as function_name
  ) expected
  WHERE function_name NOT IN (
    SELECT routine_name
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
  )
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '🎉 TOUTES LES MIGRATIONS SONT COMPLÈTES!'
    ELSE '⚠️ ÉLÉMENTS MANQUANTS: ' || string_agg(type || ': ' || item, ', ')
  END as final_status
FROM missing_items;

-- ========================================
-- RÉSUMÉ FINAL
-- ========================================

SELECT 
  '📊 RÉSUMÉ FINAL' as section,
  'Tables: ' || (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_name IN (
      'profiles', 'projects', 'contracts', 'contract_templates', 'contract_audit_trail',
      'subscriptions', 'contract_milestones', 'subcontractors', 'subcontractor_tasks',
      'reviews', 'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
    )
  ) || '/15' as tables_status,
  'Types ENUM: ' || (
    SELECT COUNT(DISTINCT typname) FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE typname IN (
      'user_type', 'project_status', 'contract_status', 'subscription_plan', 'subscription_status',
      'milestone_status', 'subcontractor_status', 'task_status', 'mediation_status',
      'contract_proposal_status', 'notification_type', 'message_status'
    )
  ) || '/12' as enums_status,
  'Fonctions: ' || (
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name IN (
      'get_contract_audit_trail', 'add_audit_trail_entry', 'validate_professional_subscription',
      'notify_compliance_expiry', 'accept_contract_proposal', 'validate_contract_proposal_users',
      'approve_milestone'
    )
  ) || '/7' as functions_status;
