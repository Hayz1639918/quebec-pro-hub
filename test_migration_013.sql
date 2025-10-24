-- Test de la migration 013_add_subcontractors.sql (VERSION FINALE)
-- Ce script teste que la migration fonctionne correctement

-- Test 1: Vérifier que les types ENUM existent (peuvent être créés par cette migration ou une précédente)
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('subcontractor_status', 'task_status')
ORDER BY typname, enumsortorder;

-- Test 2: Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('subcontractors', 'subcontractor_tasks')
ORDER BY table_name;

-- Test 3: Vérifier la structure de la table subcontractors
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subcontractors'
ORDER BY ordinal_position;

-- Test 4: Vérifier la structure de la table subcontractor_tasks
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subcontractor_tasks'
ORDER BY ordinal_position;

-- Test 5: Vérifier les index
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('subcontractors', 'subcontractor_tasks')
ORDER BY tablename, indexname;

-- Test 6: Vérifier les politiques RLS (devraient être créées sans conflit)
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('subcontractors', 'subcontractor_tasks')
ORDER BY tablename, policyname;

-- Test 7: Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('subcontractors', 'subcontractor_tasks')
ORDER BY tablename;

-- Test 8: Vérifier les contraintes de clés étrangères
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
  AND tc.table_name IN ('subcontractors', 'subcontractor_tasks')
ORDER BY tc.table_name, kcu.column_name;

-- Test 9: Vérifier que les triggers existent
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('subcontractors', 'subcontractor_tasks')
ORDER BY event_object_table, trigger_name;
