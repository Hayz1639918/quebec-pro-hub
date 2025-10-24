-- Test de la migration 012_add_compliance_expiry.sql
-- Ce script teste que la migration fonctionne correctement

-- Test 1: Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('rbq_expires_at', 'insurance_expires_at')
ORDER BY column_name;

-- Test 2: Vérifier les commentaires des colonnes
SELECT 
  c.column_name,
  obj_description(c.oid) as comment
FROM information_schema.columns c
JOIN pg_class t ON t.relname = c.table_name
WHERE c.table_name = 'profiles' 
  AND c.column_name IN ('rbq_expires_at', 'insurance_expires_at');

-- Test 3: Vérifier que la fonction existe
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_name = 'notify_compliance_expiry';

-- Test 4: Tester la fonction (optionnel - peut créer des notifications)
-- SELECT notify_compliance_expiry();

-- Test 5: Vérifier la structure de la fonction
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'notify_compliance_expiry';
