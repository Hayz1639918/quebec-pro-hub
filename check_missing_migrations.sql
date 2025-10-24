-- Script de vérification rapide des migrations manquantes
-- Ce script identifie rapidement ce qui manque

-- ========================================
-- VÉRIFICATION RAPIDE - TABLES MANQUANTES
-- ========================================

-- Tables qui devraient exister selon les migrations
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
)
SELECT 
  'TABLE MANQUANTE' as status,
  et.table_name as missing_item
FROM expected_tables et
LEFT JOIN existing_tables ext ON et.table_name = ext.table_name
WHERE ext.table_name IS NULL

UNION ALL

-- ========================================
-- VÉRIFICATION RAPIDE - TYPES ENUM MANQUANTS
-- ========================================

WITH expected_enums AS (
  SELECT unnest(ARRAY[
    'user_type', 'project_status', 'contract_status', 'subscription_plan', 'subscription_status',
    'milestone_status', 'subcontractor_status', 'task_status', 'mediation_status',
    'contract_proposal_status', 'notification_type', 'message_status'
  ]) as enum_name
),
existing_enums AS (
  SELECT DISTINCT typname as enum_name
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
)
SELECT 
  'TYPE ENUM MANQUANT' as status,
  ee.enum_name as missing_item
FROM expected_enums ee
LEFT JOIN existing_enums exe ON ee.enum_name = exe.enum_name
WHERE exe.enum_name IS NULL

UNION ALL

-- ========================================
-- VÉRIFICATION RAPIDE - FONCTIONS MANQUANTES
-- ========================================

WITH expected_functions AS (
  SELECT unnest(ARRAY[
    'get_contract_audit_trail', 'add_audit_trail_entry', 'validate_professional_subscription',
    'notify_compliance_expiry', 'accept_contract_proposal', 'validate_contract_proposal_users',
    'update_updated_at_column'
  ]) as function_name
),
existing_functions AS (
  SELECT routine_name as function_name
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
)
SELECT 
  'FONCTION MANQUANTE' as status,
  ef.function_name as missing_item
FROM expected_functions ef
LEFT JOIN existing_functions exf ON ef.function_name = exf.function_name
WHERE exf.function_name IS NULL

UNION ALL

-- ========================================
-- VÉRIFICATION RAPIDE - TRIGGERS MANQUANTS
-- ========================================

WITH expected_triggers AS (
  SELECT unnest(ARRAY[
    'update_updated_at_column', 'validate_professional_subscription_trigger',
    'validate_contract_proposal_users_trigger'
  ]) as trigger_name
),
existing_triggers AS (
  SELECT trigger_name
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public'
)
SELECT 
  'TRIGGER MANQUANT' as status,
  et.trigger_name as missing_item
FROM expected_triggers et
LEFT JOIN existing_triggers ext ON et.trigger_name = ext.trigger_name
WHERE ext.trigger_name IS NULL

ORDER BY status, missing_item;
