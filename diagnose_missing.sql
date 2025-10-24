-- Script de diagnostic simple pour identifier les migrations manquantes
-- Exécuter ce script dans Supabase SQL Editor

-- Vérifier les tables principales
SELECT 'TABLES MANQUANTES' as type, table_name as missing_item
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

-- Vérifier les types ENUM manquants
SELECT 'TYPES ENUM MANQUANTS' as type, enum_name as missing_item
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

-- Vérifier les fonctions manquantes
SELECT 'FONCTIONS MANQUANTES' as type, function_name as missing_item
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

ORDER BY type, missing_item;
