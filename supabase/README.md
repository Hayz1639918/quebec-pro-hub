# Configuration Supabase — BâtirNet

## Vue d'ensemble

Ce dossier contient les migrations et configurations pour Supabase, la plateforme backend utilisée par BâtirNet.

## Structure

```
supabase/
  ├── config.toml              # Configuration Supabase CLI
  ├── migrations/              # Migrations SQL pour la base de données
  │   └── 001_create_profiles_table.sql
  └── README.md               # Ce fichier
```

## Prérequis

1. **Compte Supabase**: Créez un compte sur [supabase.com](https://supabase.com)
2. **Supabase CLI**: Installez le CLI Supabase
   ```bash
   npm install -g supabase
   ```

## Configuration initiale

### 1. Créer un projet Supabase

1. Connectez-vous à [app.supabase.com](https://app.supabase.com)
2. Créez un nouveau projet
3. Notez votre `Project URL` et `anon/public key`

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votreprojet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique_anon
```

### 3. Appliquer les migrations

#### Option A: Via l'interface Supabase (recommandé pour commencer)

1. Allez dans votre projet Supabase
2. Cliquez sur "SQL Editor" dans le menu
3. Copiez le contenu de `migrations/001_create_profiles_table.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur "Run" pour exécuter la migration

#### Option B: Via Supabase CLI (pour production)

```bash
# Se connecter à Supabase
supabase login

# Lier le projet local au projet Supabase
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

### 4. Configurer le Storage

Le bucket `certifications` pour les certifications RBQ est créé automatiquement par la migration. Assurez-vous que :

1. Le bucket existe dans "Storage" > "Buckets"
2. Les policies sont correctement appliquées

Pour vérifier :
- Allez dans Storage > Buckets
- Vous devriez voir un bucket nommé `certifications`
- Cliquez dessus et vérifiez les "Policies"

## Structure de la base de données

### Table `profiles`

Stocke les profils des utilisateurs (clients et professionnels).

**Champs communs:**
- `id` (UUID) - ID utilisateur (référence auth.users)
- `email` (TEXT) - Email de l'utilisateur
- `full_name` (TEXT) - Nom complet
- `phone` (TEXT) - Numéro de téléphone (optionnel)
- `user_type` (ENUM) - Type d'utilisateur ('client' ou 'professional')

**Champs professionnels:**
- `company_name` (TEXT) - Nom de l'entreprise
- `rbq_number` (TEXT) - Numéro RBQ
- `rbq_certification_url` (TEXT) - URL du fichier de certification RBQ
- `services_offered` (TEXT) - Services offerts (optionnel)
- `insurance_info` (TEXT) - Informations d'assurance (optionnel)
- `is_rbq_verified` (BOOLEAN) - Statut de vérification RBQ (par défaut: false)

**Métadonnées:**
- `created_at` (TIMESTAMP) - Date de création
- `updated_at` (TIMESTAMP) - Date de dernière modification

### Storage Bucket `certifications`

Stocke les fichiers de certification RBQ téléchargés par les professionnels.

**Structure des chemins:**
```
certifications/
  └── rbq-certifications/
      └── {user_id}-rbq-{timestamp}.{ext}
```

## Policies de sécurité (Row Level Security)

### Table `profiles`

1. **Lecture propre profil**: Les utilisateurs peuvent lire leur propre profil
2. **Insertion propre profil**: Les utilisateurs peuvent créer leur propre profil
3. **Mise à jour propre profil**: Les utilisateurs peuvent modifier leur propre profil
4. **Lecture profils professionnels**: Tout le monde peut lire les profils des professionnels vérifiés

### Storage `certifications`

1. **Upload**: Les utilisateurs peuvent télécharger leurs propres certifications
2. **Lecture**: Les utilisateurs peuvent lire leurs propres certifications
3. **Lecture admin**: Les administrateurs peuvent lire toutes les certifications

## Types d'utilisateurs

### Client
- Peut créer des projets
- Peut demander des devis
- Peut évaluer les entrepreneurs
- Pas de vérification requise

### Professionnel
- Doit fournir un numéro RBQ
- Doit télécharger une certification RBQ
- Peut recevoir des demandes de devis
- Peut créer des devis
- Profil visible publiquement après vérification

## Vérification RBQ

Le champ `is_rbq_verified` indique si la certification RBQ a été vérifiée par un administrateur.

**Processus de vérification:**
1. Le professionnel s'inscrit et télécharge sa certification
2. Un administrateur examine la certification dans le dashboard
3. L'administrateur met à jour `is_rbq_verified` à `TRUE`
4. Le profil devient alors visible publiquement

Pour vérifier une certification manuellement :

```sql
UPDATE profiles 
SET is_rbq_verified = TRUE 
WHERE id = 'user-id-here';
```

## Développement local

Pour développer localement avec Supabase :

```bash
# Démarrer Supabase localement
supabase start

# Appliquer les migrations
supabase db reset

# Arrêter Supabase
supabase stop
```

## Ajout de nouvelles migrations

Pour ajouter une nouvelle migration :

1. Créez un nouveau fichier SQL dans `migrations/`
2. Nommez-le avec un numéro séquentiel : `002_nom_migration.sql`
3. Écrivez votre migration
4. Appliquez-la avec `supabase db push` ou via l'interface

## Dépannage

### Erreur "relation does not exist"
- Vérifiez que les migrations ont été appliquées
- Exécutez manuellement le SQL dans l'éditeur Supabase

### Erreur de permissions lors de l'upload
- Vérifiez que le bucket `certifications` existe
- Vérifiez que les policies sont correctement configurées
- Assurez-vous que l'utilisateur est authentifié

### Erreur "duplicate key value violates unique constraint"
- Un profil existe déjà pour cet utilisateur
- Utilisez UPDATE au lieu de INSERT si nécessaire

## Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Guide Storage](https://supabase.com/docs/guides/storage)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

