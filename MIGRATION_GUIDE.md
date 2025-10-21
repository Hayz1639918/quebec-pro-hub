# Guide de Migration - Nouveaux Filtres Professionnels

## 📋 Vue d'ensemble

Cette migration ajoute les champs nécessaires pour les nouveaux filtres de recherche des professionnels :
- **Budget** : Taux horaire et taux journalier (min/max)
- **Disponibilité** : Statut et date de disponibilité
- **Temps de réponse** : Temps de réponse moyen en heures
- **Autres** : Acceptation de petits projets, budget minimum, distance de déplacement

## 🚀 Comment appliquer la migration

### Option 1 : Via l'interface Supabase (Recommandé)

1. Connectez-vous à votre projet Supabase : https://app.supabase.com
2. Allez dans l'onglet **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `supabase/migrations/004_add_professional_filters.sql`
5. Cliquez sur **Run** pour exécuter la migration

### Option 2 : Via la CLI Supabase

Si vous avez installé la CLI Supabase :

```bash
# Installez la CLI si ce n'est pas déjà fait
npm install -g supabase

# Liez votre projet
supabase link --project-ref YOUR_PROJECT_REF

# Appliquez la migration
supabase db push
```

### Option 3 : Copier-coller le SQL

Si vous préférez copier-coller directement, voici le SQL complet :

```sql
-- Migration: Add fields for professional filtering
-- Date: 2025-10-21
-- Description: Adds budget, availability, and response time fields for professionals

-- Add availability status enum
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'unavailable');

-- Add new columns to profiles table for professional filtering
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate_min DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate_max DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_rate_min DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_rate_max DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status availability_status DEFAULT 'available';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepts_small_projects BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS minimum_project_budget DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS travel_distance_km INTEGER DEFAULT 50;

-- Add comments for documentation
COMMENT ON COLUMN profiles.hourly_rate_min IS 'Minimum hourly rate in CAD';
COMMENT ON COLUMN profiles.hourly_rate_max IS 'Maximum hourly rate in CAD';
COMMENT ON COLUMN profiles.daily_rate_min IS 'Minimum daily rate in CAD';
COMMENT ON COLUMN profiles.daily_rate_max IS 'Maximum daily rate in CAD';
COMMENT ON COLUMN profiles.availability_status IS 'Current availability status';
COMMENT ON COLUMN profiles.available_from IS 'Date from which the professional is available';
COMMENT ON COLUMN profiles.response_time_hours IS 'Average response time in hours';
COMMENT ON COLUMN profiles.accepts_small_projects IS 'Whether the professional accepts small projects';
COMMENT ON COLUMN profiles.minimum_project_budget IS 'Minimum project budget accepted in CAD';
COMMENT ON COLUMN profiles.travel_distance_km IS 'Maximum travel distance in kilometers';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_hourly_rate ON profiles(hourly_rate_min, hourly_rate_max) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles(availability_status) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_available_from ON profiles(available_from) WHERE user_type = 'professional';
CREATE INDEX IF NOT EXISTS idx_profiles_response_time ON profiles(response_time_hours) WHERE user_type = 'professional';

-- Add constraint to ensure rate ranges are valid
ALTER TABLE profiles ADD CONSTRAINT valid_hourly_rate_range 
  CHECK (hourly_rate_max IS NULL OR hourly_rate_min IS NULL OR hourly_rate_max >= hourly_rate_min);

ALTER TABLE profiles ADD CONSTRAINT valid_daily_rate_range 
  CHECK (daily_rate_max IS NULL OR daily_rate_min IS NULL OR daily_rate_max >= daily_rate_min);
```

## 🧪 Données de test (Optionnel)

Si vous voulez ajouter des données de test pour voir les filtres en action, exécutez cette requête après la migration :

```sql
-- Mettre à jour les professionnels existants avec des données de test
UPDATE profiles 
SET 
  hourly_rate_min = 50 + (RANDOM() * 50)::int,
  hourly_rate_max = 100 + (RANDOM() * 100)::int,
  availability_status = (ARRAY['available', 'busy', 'unavailable'])[1 + (RANDOM() * 2)::int]::availability_status,
  available_from = CURRENT_DATE + (RANDOM() * 30)::int,
  response_time_hours = (ARRAY[2, 6, 12, 24, 48])[1 + (RANDOM() * 4)::int],
  accepts_small_projects = RANDOM() > 0.3,
  minimum_project_budget = (ARRAY[1000, 2500, 5000, 10000, 25000])[1 + (RANDOM() * 4)::int],
  travel_distance_km = (ARRAY[25, 50, 75, 100, 150])[1 + (RANDOM() * 4)::int]
WHERE user_type = 'professional';
```

## ✅ Vérification

Après avoir appliqué la migration, vous pouvez vérifier que tout fonctionne avec cette requête :

```sql
-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'hourly_rate_min', 
  'hourly_rate_max', 
  'availability_status', 
  'available_from', 
  'response_time_hours'
);
```

## 📝 Nouveaux champs ajoutés

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `hourly_rate_min` | DECIMAL(10,2) | Taux horaire minimum (CAD) | NULL |
| `hourly_rate_max` | DECIMAL(10,2) | Taux horaire maximum (CAD) | NULL |
| `daily_rate_min` | DECIMAL(10,2) | Taux journalier minimum (CAD) | NULL |
| `daily_rate_max` | DECIMAL(10,2) | Taux journalier maximum (CAD) | NULL |
| `availability_status` | ENUM | Statut de disponibilité | 'available' |
| `available_from` | DATE | Date de disponibilité | NULL |
| `response_time_hours` | INTEGER | Temps de réponse moyen (heures) | 24 |
| `accepts_small_projects` | BOOLEAN | Accepte les petits projets | TRUE |
| `minimum_project_budget` | DECIMAL(10,2) | Budget minimum accepté (CAD) | NULL |
| `travel_distance_km` | INTEGER | Distance de déplacement max (km) | 50 |

## 🎯 Fonctionnalités activées

Une fois la migration appliquée, les utilisateurs pourront :

✅ Filtrer les professionnels par **budget** (taux horaire)
✅ Filtrer par **disponibilité** (immédiate, dans 2 semaines, dans 1 mois)
✅ Filtrer par **temps de réponse** (< 6h, < 24h, < 48h)
✅ Voir le taux horaire de chaque professionnel
✅ Voir le statut de disponibilité (badge coloré)
✅ Voir le temps de réponse moyen

## 🔧 Support

Si vous rencontrez des problèmes lors de la migration :

1. Vérifiez que vous avez les permissions nécessaires sur votre base de données
2. Consultez les logs d'erreur dans l'interface Supabase
3. Assurez-vous que le type ENUM `availability_status` n'existe pas déjà

## 📚 Ressources

- [Documentation Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Documentation Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

