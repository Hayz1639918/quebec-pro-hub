-- Script pour ajouter le type ENUM message_status manquant
-- Exécuter ce script dans Supabase SQL Editor

-- Créer le type ENUM message_status seulement s'il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
        CREATE TYPE message_status AS ENUM ('sent','delivered','read','failed');
    END IF;
END $$;

-- Vérifier que le type a été créé
SELECT 'Type message_status créé avec succès!' as status;

-- Afficher les valeurs du type
SELECT typname as type_name, enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'message_status'
ORDER BY enumsortorder;
