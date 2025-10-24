-- Test de la migration 010_add_subscriptions.sql
-- Ce script teste que la migration fonctionne correctement

-- Test 1: Vérifier que les types ENUM existent
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('subscription_plan', 'subscription_status')
ORDER BY typname, enumsortorder;

-- Test 2: Vérifier que la table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'subscriptions';

-- Test 3: Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Test 4: Vérifier les index
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'subscriptions';

-- Test 5: Vérifier les politiques RLS
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'subscriptions';

-- Test 6: Vérifier les triggers
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'subscriptions';

-- Test 7: Vérifier les fonctions
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('update_updated_at_column', 'validate_professional_subscription');
