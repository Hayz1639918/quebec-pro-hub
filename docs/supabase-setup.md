# Configuration Supabase - Guide complet

## 📋 Prérequis

- Un compte Supabase (gratuit) : https://supabase.com
- Node.js installé localement
- Le projet quebec-pro-hub cloné

## 🚀 Étape 1 : Créer un projet Supabase

1. **Allez sur** https://supabase.com et connectez-vous
2. **Cliquez sur** "New project"
3. **Remplissez les informations** :
   - **Name** : `quebec-pro-hub` (ou votre choix)
   - **Database Password** : Choisissez un mot de passe fort et **notez-le**
   - **Region** : Choisissez "Canada (Central)" ou "US East"
   - **Pricing Plan** : Free (gratuit)
4. **Cliquez sur** "Create new project"
5. ⏳ **Attendez 2-3 minutes** que le projet soit créé

## 🔑 Étape 2 : Récupérer les clés API

1. Dans votre projet Supabase, cliquez sur **⚙️ Settings** (en bas du menu de gauche)
2. Cliquez sur **API**
3. **Copiez** ces deux valeurs :
   - **Project URL** : `https://xxxxxxxxxx.supabase.co`
   - **anon public** key : une longue clé qui commence par `eyJh...`

## 📁 Étape 3 : Configurer les variables d'environnement

1. **À la racine du projet**, créez un fichier `.env`
2. **Ajoutez ces lignes** (en remplaçant par vos vraies valeurs) :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Sauvegardez** le fichier

⚠️ **Important** : Ne commitez JAMAIS le fichier `.env` dans git (il est déjà dans `.gitignore`)

## 🗄️ Étape 4 : Créer les tables dans Supabase

Dans Supabase, allez dans **SQL Editor** et exécutez ces migrations dans l'ordre :

### Migration 1 : Tables de base et profils

```sql
-- Create user type enum
CREATE TYPE user_type AS ENUM ('client', 'professional');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  user_type user_type NOT NULL DEFAULT 'client',
  company_name TEXT,
  rbq_number TEXT,
  rbq_certification_url TEXT,
  services_offered TEXT,
  insurance_info TEXT,
  is_rbq_verified BOOLEAN DEFAULT false,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  bio TEXT,
  years_experience INTEGER,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  profile_picture_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('certifications', 'certifications', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view certifications"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certifications');

CREATE POLICY "Authenticated users can upload certifications"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certifications' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view project files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'projects');

CREATE POLICY "Authenticated users can upload project files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'projects' 
    AND auth.role() = 'authenticated'
  );
```

### Migration 2 : Tables projets et propositions

```sql
-- Create project status enum
CREATE TYPE project_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Create proposal status enum
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  city TEXT,
  region TEXT,
  postal_code TEXT,
  status project_status DEFAULT 'open',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  proposals_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0
);

-- Create proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  estimated_budget DECIMAL(10,2),
  estimated_duration_days INTEGER,
  status proposal_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_images table
CREATE TABLE project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Clients can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = client_id);

-- Proposals RLS Policies
CREATE POLICY "Proposals viewable by project owner and professional"
  ON proposals FOR SELECT
  USING (
    auth.uid() = professional_id OR
    auth.uid() IN (SELECT client_id FROM projects WHERE id = project_id)
  );

CREATE POLICY "Professionals can insert proposals"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

-- Project images RLS Policies
CREATE POLICY "Project images viewable by everyone"
  ON project_images FOR SELECT
  USING (true);

CREATE POLICY "Project images insertable by project owner"
  ON project_images FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT client_id FROM projects WHERE id = project_id)
  );
```

## 🔓 Étape 5 : Désactiver la confirmation d'email (optionnel mais recommandé pour le développement)

1. Dans Supabase, allez dans **Authentication** (🔐 dans le menu de gauche)
2. Cliquez sur **Providers**
3. Cliquez sur **Email**
4. **Désactivez** "Confirm email" (toggle OFF)
5. Cliquez sur **Save**

Cela permet de s'inscrire et se connecter immédiatement sans avoir à confirmer l'email.

## ✅ Étape 6 : Tester l'application

1. **Redémarrez le serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Ouvrez** http://localhost:8080

3. **Créez un compte** :
   - Allez sur "S'inscrire"
   - Remplissez le formulaire (choisissez "Client" comme type)
   - Cliquez sur "Créer mon compte"

4. **Vous devriez être redirigé** vers le dashboard client avec :
   - "Bonjour, [Votre Nom] 👋"
   - Statistiques (0 projets actifs, etc.)
   - Boutons d'action : "Créer un nouveau projet", "Trouver un professionnel", etc.

## 🔧 Dépannage

### Erreur "Failed to fetch"

**Cause** : L'URL Supabase est incorrecte ou le serveur n'a pas rechargé les variables d'environnement.

**Solution** :
1. Vérifiez que l'URL dans `.env` correspond exactement à celle dans Supabase
2. Redémarrez complètement le serveur :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   npm run dev
   ```

### Erreur "new row violates row-level security policy"

**Cause** : Les policies RLS sont trop restrictives.

**Solution** :
```sql
-- Dans Supabase SQL Editor
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);
```

### Erreur "Email not confirmed"

**Cause** : La confirmation d'email est activée dans Supabase.

**Solution 1** : Désactiver la confirmation (voir Étape 5)

**Solution 2** : Confirmer manuellement l'email dans SQL Editor :
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'votre-email@example.com';
```

### Erreur "relation 'profiles' does not exist"

**Cause** : Les migrations SQL n'ont pas été exécutées.

**Solution** : Exécutez les migrations de l'Étape 4.

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

## 🔒 Sécurité

⚠️ **Important** :
- Ne commitez JAMAIS vos clés API dans git
- Le fichier `.env` est déjà dans `.gitignore`
- Utilisez la clé `anon/public` pour le frontend (pas la clé `service_role`)
- Les clés `service_role` donnent un accès complet à la base de données et ne doivent être utilisées que côté serveur

## 📝 Notes

- Les queries SQL exécutées dans Supabase SQL Editor sont appliquées directement à la base de données
- Elles ne sont PAS enregistrées automatiquement dans votre projet local
- Les migrations ci-dessus servent de documentation et peuvent être réexécutées sur un nouveau projet
- Pour un environnement de production, utilisez les [migrations Supabase CLI](https://supabase.com/docs/guides/cli/local-development)

