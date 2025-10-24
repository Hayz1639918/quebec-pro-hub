-- Script de vérification rapide après ajout du type ENUM manquant
-- Exécuter ce script dans Supabase SQL Editor

-- Vérifier tous les types ENUM requis
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
);

-- Vérifier spécifiquement le type message_status
SELECT 
  'MESSAGE_STATUS' as type_name,
  enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'message_status'
ORDER BY enumsortorder;

-- Vérification finale
WITH missing_enums AS (
  SELECT enum_name
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
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TOUS LES TYPES ENUM SONT PRÉSENTS!'
    ELSE '❌ TYPES ENUM MANQUANTS: ' || string_agg(enum_name, ', ')
  END as final_status
FROM missing_enums;
