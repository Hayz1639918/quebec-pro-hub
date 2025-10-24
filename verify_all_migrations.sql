-- Script de vérification complète de toutes les migrations Supabase
-- Date: 2025-10-22
-- Ce script vérifie que toutes les migrations ont été appliquées correctement

-- ========================================
-- VÉRIFICATION DES TABLES PRINCIPALES
-- ========================================

-- Test 1: Vérifier que toutes les tables principales existent
SELECT 'TABLES PRINCIPALES' as verification_type, table_name as result
FROM information_schema.tables 
WHERE table_name IN (
  'profiles',
  'projects', 
  'contracts',
  'contract_templates',
  'contract_audit_trail',
  'subscriptions',
  'contract_milestones',
  'subcontractors',
  'subcontractor_tasks',
  'reviews',
  'mediations',
  'contract_proposals',
  'notifications',
  'messages',
  'favorites'
)
ORDER BY table_name;

-- ========================================
-- VÉRIFICATION DES TYPES ENUM
-- ========================================

-- Test 2: Vérifier que tous les types ENUM existent
SELECT 'TYPES ENUM' as verification_type, typname as result
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN (
  'user_type',
  'project_status',
  'contract_status',
  'subscription_plan',
  'subscription_status',
  'milestone_status',
  'subcontractor_status',
  'task_status',
  'mediation_status',
  'contract_proposal_status',
  'notification_type',
  'message_status'
)
ORDER BY typname;

-- ========================================
-- VÉRIFICATION DES FONCTIONS
-- ========================================

-- Test 3: Vérifier que les fonctions importantes existent
SELECT 'FONCTIONS' as verification_type, routine_name as result
FROM information_schema.routines 
WHERE routine_name IN (
  'get_contract_audit_trail',
  'add_audit_trail_entry',
  'validate_professional_subscription',
  'notify_compliance_expiry',
  'accept_contract_proposal',
  'validate_contract_proposal_users',
  'update_updated_at_column'
)
ORDER BY routine_name;

-- ========================================
-- VÉRIFICATION DES TRIGGERS
-- ========================================

-- Test 4: Vérifier que les triggers importants existent
SELECT 'TRIGGERS' as verification_type, trigger_name as result
FROM information_schema.triggers 
WHERE trigger_name IN (
  'update_updated_at_column',
  'validate_professional_subscription_trigger',
  'validate_contract_proposal_users_trigger'
)
ORDER BY trigger_name;

-- ========================================
-- VÉRIFICATION DES INDEX
-- ========================================

-- Test 5: Vérifier que les index principaux existent
SELECT 'INDEX PRINCIPAUX' as verification_type, indexname as result
FROM pg_indexes 
WHERE indexname IN (
  'idx_profiles_user_type',
  'idx_projects_status',
  'idx_contracts_status',
  'idx_audit_trail_created_at',
  'idx_subscriptions_user',
  'idx_milestones_contract',
  'idx_subcontractors_owner',
  'idx_tasks_subcontractor',
  'idx_reviews_professional',
  'idx_mediations_status',
  'idx_cp_status'
)
ORDER BY indexname;

-- ========================================
-- VÉRIFICATION DES POLITIQUES RLS
-- ========================================

-- Test 6: Vérifier que RLS est activé sur les tables importantes
SELECT 'RLS ACTIVÉ' as verification_type, tablename as result
FROM pg_tables 
WHERE tablename IN (
  'profiles',
  'projects',
  'contracts',
  'contract_audit_trail',
  'subscriptions',
  'contract_milestones',
  'subcontractors',
  'subcontractor_tasks',
  'reviews',
  'mediations',
  'contract_proposals',
  'notifications',
  'messages',
  'favorites'
)
AND rowsecurity = true
ORDER BY tablename;

-- ========================================
-- VÉRIFICATION DES CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ========================================

-- Test 7: Vérifier les contraintes FK principales
SELECT 
  'CLÉS ÉTRANGÈRES' as verification_type,
  tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as result
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN (
    'projects', 'contracts', 'contract_audit_trail', 'subscriptions',
    'contract_milestones', 'subcontractors', 'subcontractor_tasks',
    'reviews', 'mediations', 'contract_proposals'
  )
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- RÉSUMÉ DE VÉRIFICATION
-- ========================================

-- Test 8: Compter le nombre d'éléments par catégorie
SELECT 
  'RÉSUMÉ' as verification_type,
  'Tables: ' || COUNT(*) as result
FROM information_schema.tables 
WHERE table_name IN (
  'profiles', 'projects', 'contracts', 'contract_templates', 'contract_audit_trail',
  'subscriptions', 'contract_milestones', 'subcontractors', 'subcontractor_tasks',
  'reviews', 'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
)

UNION ALL

SELECT 
  'RÉSUMÉ' as verification_type,
  'Types ENUM: ' || COUNT(DISTINCT typname) as result
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN (
  'user_type', 'project_status', 'contract_status', 'subscription_plan', 'subscription_status',
  'milestone_status', 'subcontractor_status', 'task_status', 'mediation_status',
  'contract_proposal_status', 'notification_type', 'message_status'
)

UNION ALL

SELECT 
  'RÉSUMÉ' as verification_type,
  'Fonctions: ' || COUNT(*) as result
FROM information_schema.routines 
WHERE routine_name IN (
  'get_contract_audit_trail', 'add_audit_trail_entry', 'validate_professional_subscription',
  'notify_compliance_expiry', 'accept_contract_proposal', 'validate_contract_proposal_users',
  'update_updated_at_column'
)

UNION ALL

SELECT 
  'RÉSUMÉ' as verification_type,
  'Triggers: ' || COUNT(*) as result
FROM information_schema.triggers 
WHERE trigger_name IN (
  'update_updated_at_column', 'validate_professional_subscription_trigger',
  'validate_contract_proposal_users_trigger'
)

UNION ALL

SELECT 
  'RÉSUMÉ' as verification_type,
  'Index: ' || COUNT(*) as result
FROM pg_indexes 
WHERE indexname IN (
  'idx_profiles_user_type', 'idx_projects_status', 'idx_contracts_status',
  'idx_audit_trail_created_at', 'idx_subscriptions_user', 'idx_milestones_contract',
  'idx_subcontractors_owner', 'idx_tasks_subcontractor', 'idx_reviews_professional',
  'idx_mediations_status', 'idx_cp_status'
)

UNION ALL

SELECT 
  'RÉSUMÉ' as verification_type,
  'Tables avec RLS: ' || COUNT(*) as result
FROM pg_tables 
WHERE tablename IN (
  'profiles', 'projects', 'contracts', 'contract_audit_trail', 'subscriptions',
  'contract_milestones', 'subcontractors', 'subcontractor_tasks', 'reviews',
  'mediations', 'contract_proposals', 'notifications', 'messages', 'favorites'
)
AND rowsecurity = true;
