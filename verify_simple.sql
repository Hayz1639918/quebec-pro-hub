-- Script de vérification finale simple
-- Exécuter ce script dans Supabase SQL Editor

-- Compter les tables principales
SELECT 
  'TABLES' as category,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN (
  'profiles', 'projects', 'contracts', 'contract_templates', 'contract_audit_trail',
  'subscriptions', 'contract_milestones', 'subcontractors', 'subcontractor_tasks',
  'reviews', 'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
)

UNION ALL

-- Compter les types ENUM
SELECT 
  'TYPES ENUM' as category,
  COUNT(DISTINCT typname) as count
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN (
  'user_type', 'project_status', 'contract_status', 'subscription_plan', 'subscription_status',
  'milestone_status', 'subcontractor_status', 'task_status', 'mediation_status',
  'contract_proposal_status', 'notification_type', 'message_status'
)

UNION ALL

-- Compter les fonctions
SELECT 
  'FONCTIONS' as category,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN (
  'get_contract_audit_trail', 'add_audit_trail_entry', 'validate_professional_subscription',
  'notify_compliance_expiry', 'accept_contract_proposal', 'validate_contract_proposal_users',
  'approve_milestone'
);

-- Vérifier s'il y a des éléments manquants
WITH missing_items AS (
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
    WHEN COUNT(*) = 0 THEN '✅ TOUTES LES MIGRATIONS SONT APPLIQUÉES!'
    ELSE '❌ ÉLÉMENTS MANQUANTS: ' || string_agg(type || ': ' || item, ', ')
  END as final_status
FROM missing_items;
