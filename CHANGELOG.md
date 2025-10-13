# Changelog — BâtirNet

## [Non publié] - 2025-10-13

### Ajouté

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
│   │   └── Auth.tsx                                  [MODIFIÉ]
│   └── integrations/
│       └── supabase/
│           └── types.ts                              [MODIFIÉ]
├── supabase/
│   ├── migrations/
│   │   └── 001_create_profiles_table.sql             [NOUVEAU]
│   └── README.md                                     [NOUVEAU]
├── docs/
│   ├── authentication.md                             [NOUVEAU]
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

