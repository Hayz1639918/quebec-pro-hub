-- Test de la migration 014_add_mediation.sql (VERSION FINALE)
-- Ce script teste que la migration fonctionne correctement

-- Test 1: Vérifier que le type ENUM mediation_status existe
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'mediation_status'
ORDER BY enumsortorder;

-- Test 2: Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('reviews', 'mediations')
ORDER BY table_name;

-- Test 3: Vérifier la structure de la table reviews
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

-- Test 4: Vérifier la structure de la table mediations
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'mediations'
ORDER BY ordinal_position;

-- Test 5: Vérifier les index
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('reviews', 'mediations')
ORDER BY tablename, indexname;

-- Test 6: Vérifier les politiques RLS pour reviews
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY policyname;

-- Test 7: Vérifier les politiques RLS pour mediations
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'mediations'
ORDER BY policyname;

-- Test 8: Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('reviews', 'mediations')
ORDER BY tablename;

-- Test 9: Vérifier les contraintes de clés étrangères
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
  AND tc.table_name IN ('reviews', 'mediations')
ORDER BY tc.table_name, kcu.column_name;

-- Test 10: Vérifier les contraintes CHECK
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.check_constraints AS cc
      ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_name IN ('reviews', 'mediations')
ORDER BY tc.table_name, tc.constraint_name;
