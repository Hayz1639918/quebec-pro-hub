-- Test de la migration 009_add_signature_audit_trail.sql
-- Ce script teste que la migration fonctionne correctement

-- Test 1: Vérifier que la table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'contract_audit_trail';

-- Test 2: Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contract_audit_trail'
ORDER BY ordinal_position;

-- Test 3: Vérifier que les fonctions existent
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_contract_audit_trail', 'add_audit_trail_entry');

-- Test 4: Vérifier les index
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'contract_audit_trail';

-- Test 5: Vérifier les politiques RLS
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'contract_audit_trail';
