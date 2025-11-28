-- Vérifier l'existence et la structure de la table proposals

-- 1. Vérifier si la table existe
SELECT 
    'Table proposals existe' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'proposals';

-- 2. Voir la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'proposals'
ORDER BY ordinal_position;

-- 3. Vérifier les RLS policies sur proposals
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'proposals';

-- 4. Tester une insertion simple (commenté pour la sécurité)
-- Décommentez ces lignes pour tester manuellement :
-- INSERT INTO proposals (
--   project_id,
--   professional_id,
--   message,
--   estimated_budget,
--   estimated_duration_days,
--   status
-- ) VALUES (
--   'YOUR_PROJECT_ID',
--   auth.uid(),
--   'Test proposition',
--   25000,
--   30,
--   'pending'
-- );











