-- Test de la migration 015_add_contract_proposals.sql (VERSION FINALE - SYNTAXE CORRIGÉE)
-- Ce script teste que la migration fonctionne correctement

-- Test 1: Vérifier que le type ENUM contract_proposal_status existe
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'contract_proposal_status'
ORDER BY enumsortorder;

-- Test 2: Vérifier que la table contract_proposals existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'contract_proposals';

-- Test 3: Vérifier la structure de la table contract_proposals
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contract_proposals'
ORDER BY ordinal_position;

-- Test 4: Vérifier les index
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'contract_proposals'
ORDER BY indexname;

-- Test 5: Vérifier les politiques RLS
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'contract_proposals'
ORDER BY policyname;

-- Test 6: Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'contract_proposals';

-- Test 7: Vérifier les contraintes de clés étrangères
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'contract_proposals'
ORDER BY kcu.column_name;

-- Test 8: Vérifier que les triggers existent
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'contract_proposals'
ORDER BY trigger_name;

-- Test 9: Vérifier que la fonction accept_contract_proposal existe
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'accept_contract_proposal';

-- Test 10: Vérifier les contraintes CHECK (ne devrait plus y en avoir avec sous-requêtes)
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.check_constraints AS cc
      ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_name = 'contract_proposals'
ORDER BY tc.constraint_name;
