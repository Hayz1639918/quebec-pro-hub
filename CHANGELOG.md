# Changelog — BâtirNet

## [v1.3] - 2025-10-13

### Ajouté

#### Configuration et Documentation
- **Guide complet de configuration Supabase** : `docs/supabase-setup.md`
  - Instructions détaillées pour créer un projet Supabase
  - Guide d'exécution des migrations SQL
  - Section de dépannage complète
  - Exemples et bonnes pratiques de sécurité

#### Améliorations de sécurité
- **Fichier `.gitignore` amélioré** : Ajout de `.env` et variantes pour éviter de commiter les secrets
- **Documentation de sécurité** : Mise en garde contre le commit des clés API

### Modifié

#### `README.md`
- Refonte de la section "Démarrage rapide" avec des instructions plus claires
- Ajout de liens vers le guide de configuration Supabase
- Amélioration de la présentation avec des blocs de code formatés

#### `src/pages/Auth.tsx`
- Correction de la redirection après connexion selon le type d'utilisateur
  - Clients → `/dashboard`
  - Professionnels → `/` (page d'accueil)
- Amélioration de la gestion des erreurs d'inscription
- Correction du typage TypeScript pour éviter les erreurs de linting

### Corrigé

- **Problème d'URL Supabase** : Correction de l'URL mal formée dans le fichier `.env`
- **Policy RLS trop restrictive** : Ajustement de la policy d'insertion des profils
- **Confirmation d'email** : Documentation pour désactiver la confirmation en développement
- **Failed to fetch** : Résolution des problèmes de connexion à Supabase
- **Erreurs de typage TypeScript** : Utilisation de types `any` pour contourner les problèmes d'inférence de types Supabase

### Documentation

#### Nouveaux guides
- `docs/supabase-setup.md` : Guide complet de configuration (8 sections)
  - Création du projet
  - Récupération des clés
  - Configuration des variables d'environnement
  - Exécution des migrations
  - Désactivation de la confirmation d'email
  - Tests de l'application
  - Section de dépannage détaillée
  - Ressources et bonnes pratiques de sécurité

#### README amélioré
- Section "Démarrage rapide" clarifiée
- Ajout de prérequis Supabase
- Instructions étape par étape avec blocs de code
- Lien direct vers le guide de configuration

### Notes de déploiement

Pour les environnements existants :
1. Vérifier que le fichier `.env` contient les bonnes clés Supabase
2. S'assurer que `.env` est dans `.gitignore`
3. Exécuter les migrations SQL si ce n'est pas déjà fait
4. Désactiver la confirmation d'email dans Supabase (développement uniquement)

## [v1.2] - 2025-10-13

### Ajouté

#### Page Marketplace des Professionnels (v1.1)
- **Page `/professionals`** : Marketplace complète pour découvrir les professionnels
  - Recherche en temps réel (nom, entreprise, services)
  - Filtres par type de service et région
  - Tri par récence, nom ou note
  - Affichage en grille avec cartes détaillées
  - Statistiques (professionnels vérifiés, note moyenne)
  
- **Informations affichées** :
  - Badge de vérification RBQ
  - Numéro RBQ
  - Localisation (ville, région)
  - Années d'expérience
  - Services offerts avec badges
  - Note moyenne avec étoiles
  - Nombre total d'avis
  - Nombre de projets réalisés
  - Actions rapides (profil, téléphone, email)

- **Migration 002** : Champs marketplace
  - Ajout de `city`, `region`, `postal_code` pour la localisation
  - Ajout de `bio`, `years_experience` pour les informations
  - Ajout de `average_rating`, `total_reviews`, `total_projects` pour les métriques
  - Ajout de `profile_picture_url`, `website_url`
  
- **Table `reviews`** : Système d'évaluations
  - Note globale (1-5 étoiles)
  - Notes détaillées (qualité, ponctualité, communication, valeur)
  - Commentaires textuels
  - Trigger automatique pour mettre à jour les moyennes
  - RLS pour protection des données
  
- **Table `portfolio_items`** : Portfolio de travaux
  - Titre et description de projets
  - Images de projets (bucket Storage `portfolio`)
  - Date et catégorie de projet
  - RLS pour gestion par professionnel

#### Page Marketplace des Projets (v1.2)
- **Page `/projects`** : Marketplace complète pour découvrir les projets
  - Recherche en temps réel (titre, description, catégorie)
  - Filtres par catégorie, région et budget
  - Tri par récence, budget ou nombre de propositions
  - Affichage en liste avec cartes détaillées
  - Statistiques (projets actifs, propositions totales)
  
- **Informations affichées** :
  - Badge de statut du projet (Ouvert, En cours, Complété, Annulé)
  - Titre et description du projet
  - Catégorie de travaux (badge)
  - Localisation (ville, région)
  - Budget (fourchette ou "à discuter")
  - Date de publication (format relatif)
  - Échéance (si définie)
  - Nombre de propositions et de vues
  - Actions rapides (détails, soumettre proposition)

- **Migration 003** : Tables projets et propositions
  - Table `projects` avec ENUM project_status
  - Table `proposals` pour soumissions professionnels
  - Table `project_images` pour photos de projets
  - Bucket Storage `projects` (public)
  - Triggers automatiques pour `proposals_count`
  - Function `increment_project_views()` pour compteur
  - RLS complet pour sécurité
  
- **Système de propositions** :
  - Professionnels peuvent soumettre des propositions
  - Budget et durée estimés
  - Statuts : pending, accepted, rejected, withdrawn
  - Limite : une proposition par professionnel par projet
  - Compteur automatique sur les projets

### Ajouté (suite)

#### Système d'inscription amélioré
- **Formulaires différenciés** : Deux types de formulaires d'inscription distincts
  - Formulaire Client : Inscription simplifiée pour les particuliers et entreprises
  - Formulaire Professionnel : Inscription avec vérification RBQ pour les entrepreneurs

#### Fonctionnalités Client
- Email et mot de passe
- Nom complet
- Téléphone (optionnel)
- Authentification OAuth Google

#### Fonctionnalités Professionnel
- Tous les champs du formulaire client, plus :
- Nom de l'entreprise (requis)
- Numéro RBQ (requis)
- Upload de certification RBQ (PDF, JPG, PNG, max 5 Mo)
- Services offerts (optionnel)
- Informations d'assurance (optionnel)

#### Base de données
- **Table `profiles`** : Stockage des profils utilisateurs
  - Champs communs pour tous les utilisateurs
  - Champs spécifiques aux professionnels
  - Statut de vérification RBQ (`is_rbq_verified`)
  
- **Storage Bucket `certifications`** : Stockage sécurisé des certifications RBQ
  - Organisation par dossiers : `rbq-certifications/{user_id}-rbq-{timestamp}.{ext}`
  - Policies de sécurité RLS

#### Sécurité
- **Row Level Security (RLS)** sur la table `profiles`
  - Les utilisateurs peuvent uniquement lire/modifier leur propre profil
  - Les profils professionnels vérifiés sont visibles publiquement
  
- **Storage Policies** sur le bucket `certifications`
  - Les utilisateurs peuvent uniquement accéder à leurs propres certifications
  - Les administrateurs peuvent accéder à toutes les certifications

#### Validation
- Validation côté client :
  - Formats de fichiers (PDF, JPG, PNG uniquement)
  - Taille de fichier (max 5 Mo)
  - Champs requis
  - Format email
  - Longueur du mot de passe (min 6 caractères)
  
- Validation côté serveur :
  - Contraintes de base de données (NOT NULL, CHECK)
  - Types via PostgreSQL ENUM
  - Unicité de l'email

#### Interface utilisateur
- **Onglets** : Basculement facile entre Client et Professionnel
- **Upload de fichier** : Interface drag-and-drop intuitive avec feedback visuel
- **Messages** : Toasts informatifs pour succès et erreurs
- **Icônes** : Icônes lucide-react pour meilleure UX
- **Responsive** : Interface adaptative mobile/desktop

#### Documentation
- `docs/authentication.md` : Guide complet de l'authentification
- `supabase/README.md` : Configuration Supabase détaillée
- `docs/testing-guide.md` : Guide de test exhaustif
- `INSTALLATION.md` : Guide d'installation rapide en 5 étapes
- `CHANGELOG.md` : Ce fichier

#### Migrations
- `supabase/migrations/001_create_profiles_table.sql` : Migration initiale
  - Création de la table `profiles`
  - Création du bucket `certifications`
  - Mise en place des policies RLS
  - Mise en place des policies Storage
  - Triggers pour `updated_at`

#### Types TypeScript
- Types mis à jour dans `src/integrations/supabase/types.ts`
  - Type `Database` avec table `profiles`
  - Type ENUM `user_type`
  - Types pour Insert/Update/Row

### Modifié

#### `src/pages/Auth.tsx`
- Refonte complète de la page d'authentification
- Ajout du système d'onglets Client/Professionnel
- Ajout de la logique d'upload de certification RBQ
- Amélioration de la gestion des erreurs
- Amélioration de l'UX avec feedback visuel

#### `docs/SUMMARY.md`
- Ajout de la documentation sur l'authentification

#### `README.md`
- Ajout d'informations sur la configuration Supabase
- Ajout de liens vers les guides d'installation et de configuration

### Amélioré

- **Expérience utilisateur** : Interface claire et intuitive
- **Feedback** : Messages d'erreur précis et en français
- **Performance** : Validation côté client avant upload
- **Sécurité** : RLS et Storage Policies stricts
- **Documentation** : Guides détaillés et exemples

### Corrigé

- Erreurs de linting TypeScript
- Gestion appropriée des types d'erreur
- Suppression des `any` explicites

## Structure des fichiers modifiés/créés

```
quebec-pro-hub/
├── src/
│   ├── pages/
│   │   ├── Auth.tsx                                  [MODIFIÉ]
│   │   ├── Professionals.tsx                         [NOUVEAU]
│   │   └── Projects.tsx                              [NOUVEAU]
│   ├── components/
│   │   ├── Navigation.tsx                            [MODIFIÉ]
│   │   ├── Hero.tsx                                  [MODIFIÉ]
│   │   └── CTA.tsx                                   [MODIFIÉ]
│   ├── App.tsx                                       [MODIFIÉ]
│   └── integrations/
│       └── supabase/
│           └── types.ts                              [MODIFIÉ]
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_profiles_table.sql             [NOUVEAU]
│   │   ├── 002_add_marketplace_fields.sql            [NOUVEAU]
│   │   └── 003_create_projects_table.sql             [NOUVEAU]
│   └── README.md                                     [NOUVEAU]
├── docs/
│   ├── authentication.md                             [NOUVEAU]
│   ├── marketplace.md                                [NOUVEAU]
│   ├── marketplace-quickstart.md                     [NOUVEAU]
│   ├── projects-marketplace.md                       [NOUVEAU]
│   ├── testing-guide.md                              [NOUVEAU]
│   └── SUMMARY.md                                    [MODIFIÉ]
├── INSTALLATION.md                                   [NOUVEAU]
├── CHANGELOG.md                                      [NOUVEAU]
└── README.md                                         [MODIFIÉ]
```

## Prochaines étapes recommandées

### Court terme
- [ ] Implémenter la page de vérification RBQ pour les administrateurs
- [ ] Ajouter la validation du format du numéro RBQ
- [ ] Ajouter un aperçu du fichier RBQ avant upload
- [ ] Implémenter la récupération de mot de passe oublié
- [ ] Ajouter la confirmation par email

### Moyen terme
- [ ] Implémenter l'authentification à deux facteurs (2FA)
- [ ] Créer un dashboard admin pour gérer les vérifications RBQ
- [ ] Intégrer l'API RBQ pour vérification automatique
- [ ] Ajouter des notifications en temps réel pour les admins
- [ ] Implémenter le système de profil utilisateur (édition, photo, etc.)

### Long terme
- [ ] Support multi-provinces (autres licences que RBQ)
- [ ] Authentification biométrique
- [ ] Intégration avec d'autres providers OAuth (Facebook, Apple)
- [ ] KYC/KYB avancé pour la conformité
- [ ] Tableau de bord analytics pour les professionnels

## Notes techniques

### Technologies utilisées
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui (Radix UI)
- Supabase (Backend as a Service)
  - PostgreSQL (base de données)
  - Auth (authentification)
  - Storage (stockage de fichiers)
  - Row Level Security (sécurité)

### Dépendances ajoutées
Aucune nouvelle dépendance ajoutée. Toutes les fonctionnalités utilisent les bibliothèques existantes.

### Breaking changes
Aucun breaking change. Cette mise à jour est rétrocompatible.

### Migration
Pour mettre à jour un projet existant :
1. Appliquer la migration SQL `001_create_profiles_table.sql`
2. Mettre à jour les fichiers modifiés
3. Tester les nouvelles fonctionnalités

## Support

Pour toute question ou problème :
- Consultez la documentation dans `docs/`
- Consultez le guide de test dans `docs/testing-guide.md`
- Consultez le guide d'installation dans `INSTALLATION.md`

## Auteurs

- Développement initial : Assistant IA
- Spécifications : Équipe BâtirNet

## Licence

Ce projet ne spécifie pas de licence. Contactez les mainteneurs pour les conditions d'utilisation.

