# Fonctionnalités Client — BâtirNet

## Vue d'ensemble

Cette documentation décrit les fonctionnalités disponibles pour les clients de la plateforme BâtirNet. Les clients peuvent créer des projets, recevoir des propositions, et gérer leurs travaux de construction/rénovation.

## Dashboard Client

### Accès
**URL** : `/dashboard`

**Authentification** : Requise (compte client uniquement)

### Fonctionnalités

#### Vue d'ensemble
- **Statistiques rapides** :
  - Projets actifs
  - Propositions reçues
  - Professionnels favoris
  - Contrats actifs

- **Actions rapides** :
  - Créer un nouveau projet
  - Trouver un professionnel
  - Explorer les projets

- **Activité récente** :
  - Dernières mises à jour
  - Notifications

- **Guide de démarrage** :
  - Pour les nouveaux utilisateurs
  - 4 étapes pour réussir son projet

#### Onglets

**Mes Projets** :
- Liste de tous les projets créés
- Statuts : Ouvert, En cours, Complété, Annulé
- Accès rapide à la création

**Propositions** :
- Toutes les propositions reçues
- Filtrage par projet
- Statuts : En attente, Acceptée, Refusée

**Favoris** :
- Shortlist de professionnels sauvegardés
- Comparaison rapide
- Liens vers les profils

## Création de Projet

### Accès
**URL** : `/dashboard/new-project`

**Authentification** : Requise (compte client uniquement)

### Formulaire

#### Champs obligatoires (*)
1. **Titre du projet**
   - Ex: "Rénovation complète de cuisine"
   - Texte court et descriptif

2. **Catégorie**
   - Liste déroulante avec 12 catégories
   - Rénovation résidentielle
   - Construction neuve
   - Toiture, Plomberie, Électricité, etc.

3. **Description**
   - Zone de texte multi-lignes
   - Détails du projet
   - Plus c'est détaillé, meilleures sont les propositions

#### Champs optionnels

**Budget** :
- Budget minimum ($)
- Budget maximum ($)
- Validation : max >= min
- Peut être laissé vide ("Budget à discuter")

**Localisation** :
- Ville (texte libre)
- Région (liste déroulante - 10 régions)
- Code postal (format XXX XXX)

**Échéance** :
- Date souhaitée de fin
- Sélecteur de calendrier
- Dates passées désactivées

**Photos/Documents** :
- Upload multiple (max 5 fichiers)
- Formats acceptés : JPG, PNG, PDF
- Taille max : 5 Mo par fichier
- Aperçu des fichiers sélectionnés
- Suppression individuelle possible

### Workflow

1. **Remplir le formulaire**
   - Tous les champs obligatoires
   - Ajouter des détails optionnels

2. **Uploader des fichiers** (optionnel)
   - Plans, photos d'inspiration
   - État actuel du lieu

3. **Soumettre**
   - Validation automatique
   - Upload des images vers Storage
   - Création du projet en base

4. **Projet publié**
   - Statut : "Ouvert"
   - Visible dans la marketplace `/projects`
   - Les professionnels peuvent soumettre des propositions

## Recherche de Professionnels

### Accès
**URL** : `/professionals`

### Fonctionnalités disponibles

#### Recherche
- Barre de recherche en temps réel
- Par nom, entreprise ou service

#### Filtres
- Type de service (11 catégories)
- Région (10 régions du Québec)
- Tri : Récents, Nom, Meilleures notes

#### Informations affichées
- Badge de vérification RBQ
- Note moyenne avec étoiles
- Nombre d'avis
- Nombre de projets réalisés
- Années d'expérience
- Services offerts
- Localisation

#### Actions
- Voir le profil détaillé
- Contacter (téléphone/email)
- Ajouter aux favoris (à venir)

## Gestion des Propositions

### Réception
- Les professionnels soumettent des propositions sur vos projets
- Notification lors de réception (à venir)
- Compteur de propositions par projet

### Consultation
- Accès via Dashboard > Propositions
- Informations incluses :
  - Message du professionnel
  - Budget estimé
  - Durée estimée (en jours)
  - Date de proposition

### Actions possibles
- Accepter une proposition
- Refuser une proposition
- Demander plus d'informations (messagerie - à venir)
- Comparer plusieurs propositions

## Sécurité et Accès

### Authentification
- Connexion requise pour accéder au dashboard
- Redirection automatique vers `/auth?mode=login`
- Session persistante

### Vérifications
- Seuls les clients peuvent créer des projets
- Seuls les propriétaires voient leurs projets
- Row Level Security (RLS) en base de données

### Données protégées
- Informations personnelles
- Projets en cours
- Propositions reçues
- Historique de paiements

## Navigation

### Barre de navigation (connecté)
- Logo BâtirNet → Page d'accueil
- Trouver un professionnel → Marketplace
- Découvrir nos projets → Projets publics
- Icône Globe → Changement de langue
- Icône Utilisateur → Menu déroulant
  - Nom de l'utilisateur
  - Type de compte (Client)
  - Dashboard
  - Déconnexion

### Menu Dashboard
- Vue d'ensemble
- Mes Projets
- Propositions
- Favoris

## Fonctionnalités à venir

### Court terme
- [ ] Page "Mes Projets" détaillée
- [ ] Système de favoris/shortlist
- [ ] Page de comparaison de propositions
- [ ] Modification de projets existants
- [ ] Suppression de projets

### Moyen terme
- [ ] Système de messagerie intégré
- [ ] Notifications en temps réel
- [ ] Page de profil client (édition)
- [ ] Historique complet (projets, contrats, factures)
- [ ] Upload de documents supplémentaires

### Long terme
- [ ] Signature électronique de contrats
- [ ] Paiements par jalons
- [ ] Système de médiation/litiges
- [ ] Évaluations et notes des professionnels
- [ ] Alertes sur statut légal des pros suivis
- [ ] Multi-langue complet (FR/EN)
- [ ] Application mobile

## Base de données

### Tables utilisées

#### `profiles`
- Informations du client
- Champs : full_name, email, phone, user_type

#### `projects`
- Tous les projets créés
- Champs : title, description, category, budget, location, deadline, status
- Compteurs : proposals_count, views_count

#### `proposals`
- Propositions des professionnels
- Champs : message, estimated_budget, estimated_duration_days, status
- Contrainte : une proposition par pro par projet

#### `project_images`
- Images liées aux projets
- Champs : image_url, caption, display_order

### Storage Buckets

#### `projects`
- Photos et documents des projets
- Public (visibles par tous)
- Structure : `{user_id}/{timestamp}-{random}.{ext}`

## Statistiques Dashboard

### Calcul en temps réel
```typescript
// Projets actifs
status IN ('open', 'in_progress')

// Total projets
COUNT(*) WHERE client_id = user_id

// Propositions reçues
JOIN proposals ON projects.id = proposals.project_id
WHERE projects.client_id = user_id

// Favoris
COUNT(*) FROM favorites WHERE client_id = user_id (à venir)
```

## Exemples d'utilisation

### Créer son premier projet

1. **Connexion**
   - Aller sur `/auth?mode=login`
   - Entrer email et mot de passe
   - Redirection automatique vers `/dashboard`

2. **Nouveau projet**
   - Cliquer sur "Créer un nouveau projet"
   - Remplir le formulaire :
     - Titre : "Rénovation complète cuisine"
     - Catégorie : "Cuisine et salle de bain"
     - Description : Détailler les travaux
     - Budget : 15 000 $ - 25 000 $
     - Ville : Montréal
     - Région : Montréal
   - Ajouter des photos (optionnel)
   - Cliquer sur "Publier le projet"

3. **Attendre les propositions**
   - Le projet apparaît dans la marketplace
   - Les professionnels peuvent soumettre des offres
   - Notification lors de réception (à venir)

4. **Consulter les propositions**
   - Dashboard > Propositions
   - Comparer les offres
   - Contacter les professionnels

5. **Accepter une proposition**
   - Sélectionner la meilleure offre
   - Formaliser avec un contrat (à venir)
   - Suivre l'avancement

## Support

### Problèmes courants

**Je ne peux pas créer de projet**
- Vérifiez que vous êtes connecté
- Vérifiez que votre compte est de type "Client"
- Tous les champs obligatoires doivent être remplis

**Mes photos ne s'uploadent pas**
- Format accepté : JPG, PNG, PDF uniquement
- Taille max : 5 Mo par fichier
- Max 5 fichiers

**Je ne vois pas mes projets**
- Vérifiez que vous êtes sur le bon compte
- Rafraîchissez la page
- Vérifiez votre connexion

### Ressources
- Guide d'installation : `INSTALLATION.md`
- Documentation technique : `docs/architecture.md`
- Configuration Supabase : `supabase/README.md`
- Marketplace projets : `docs/projects-marketplace.md`

