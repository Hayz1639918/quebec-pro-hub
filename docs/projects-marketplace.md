# Marketplace des Projets — BâtirNet

## Vue d'ensemble

La marketplace des projets permet aux professionnels de découvrir des opportunités de travail et aux clients de publier leurs besoins. C'est un espace de mise en relation bidirectionnel où les clients postent des projets et les entrepreneurs soumettent des propositions.

## Accès

**URL** : `/projects`

**Navigation** : 
- Bouton "Découvrir nos projets" dans la barre de navigation
- Accessible à tous (visiteurs et utilisateurs connectés)

## Fonctionnalités

### 1. Recherche

**Barre de recherche principale** :
- Recherche en temps réel
- Recherche par :
  - Titre du projet
  - Description
  - Catégorie

### 2. Filtres

#### Catégorie
- Toutes les catégories (par défaut)
- Rénovation résidentielle
- Construction neuve
- Toiture
- Plomberie
- Électricité
- Menuiserie
- Maçonnerie
- Peinture
- Isolation
- Aménagement paysager
- Cuisine et salle de bain
- Extension et agrandissement

#### Région
- Toutes les régions (par défaut)
- Montréal, Québec, Laval, Gatineau...
- (même liste que marketplace professionnels)

#### Budget
- Tous les budgets
- Moins de 5 000 $
- 5 000 $ - 10 000 $
- 10 000 $ - 25 000 $
- 25 000 $ - 50 000 $
- 50 000 $ - 100 000 $
- Plus de 100 000 $

#### Tri
- **Plus récents** : Projets récemment publiés
- **Budget élevé** : Tri décroissant par budget maximum
- **Budget faible** : Tri croissant par budget minimum
- **Plus de propositions** : Projets avec le plus de propositions

### 3. Affichage des résultats

Chaque carte de projet affiche :

#### Informations principales
- **Titre du projet**
- **Badge de statut** : Ouvert, En cours, Complété, Annulé
- **Date de publication** : Format relatif (Il y a X jours)
- **Localisation** : Ville et région

#### Détails
- **Catégorie** : Badge avec type de travaux
- **Description** : Texte limité à 3 lignes
- **Budget** : Fourchette ou "Budget à discuter"
- **Échéance** : Date limite (si spécifiée)

#### Statistiques
- **Propositions** : Nombre de propositions reçues
- **Vues** : Nombre de visites du projet

#### Actions
- **Voir les détails** : Navigation vers la page de projet détaillée
- **Soumettre une proposition** : Pour les professionnels connectés

### 4. États du projet

- **Open (Ouvert)** : Accepte des propositions (vert)
- **In Progress (En cours)** : Projet attribué (bleu)
- **Completed (Complété)** : Projet terminé (gris)
- **Cancelled (Annulé)** : Projet annulé (rouge)

## Architecture technique

### Composant
`src/pages/Projects.tsx`

### Types TypeScript
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string | null;
  client_id: string;
  created_at: string;
  updated_at: string;
  proposals_count: number;
  views_count: number;
}
```

### Requête Supabase

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'open')  // Uniquement les projets ouverts
  .order('created_at', { ascending: false });
```

### Logique de filtrage

1. **Recherche textuelle** : Titre, description et catégorie
2. **Catégorie** : Correspondance exacte avec `category`
3. **Région** : Recherche dans `city` et `region`
4. **Budget** : Filtrage par fourchette de prix
5. **Tri** : Application du tri sélectionné

## Base de données

### Tables utilisées

#### `projects`
Stocke les projets de construction/rénovation.

**Champs** :
- `id` : UUID du projet
- `client_id` : Référence au client (profiles)
- `title` : Titre du projet
- `description` : Description détaillée
- `category` : Catégorie de travaux
- `budget_min` : Budget minimum (optionnel)
- `budget_max` : Budget maximum (optionnel)
- `city` : Ville
- `region` : Région
- `postal_code` : Code postal
- `status` : Statut du projet (ENUM)
- `deadline` : Date d'échéance (optionnel)
- `proposals_count` : Nombre de propositions (auto)
- `views_count` : Nombre de vues
- `created_at` : Date de création
- `updated_at` : Date de modification

**Contraintes** :
- `client_id` doit être un utilisateur de type 'client'
- `budget_max` >= `budget_min` (si les deux sont définis)
- Seuls les clients peuvent créer des projets

#### `proposals`
Stocke les propositions des professionnels.

**Champs** :
- `id` : UUID de la proposition
- `project_id` : Référence au projet
- `professional_id` : Référence au professionnel
- `message` : Message de la proposition
- `estimated_budget` : Budget estimé
- `estimated_duration_days` : Durée estimée en jours
- `status` : pending, accepted, rejected, withdrawn
- `created_at` : Date de création
- `updated_at` : Date de modification

**Contraintes** :
- `professional_id` doit être un professionnel vérifié RBQ
- Une seule proposition par professionnel par projet (UNIQUE)

#### `project_images`
Stocke les images associées aux projets.

**Champs** :
- `id` : UUID de l'image
- `project_id` : Référence au projet
- `image_url` : URL de l'image
- `caption` : Légende (optionnel)
- `display_order` : Ordre d'affichage
- `created_at` : Date d'ajout

### Migrations

#### Migration 003
Création des tables projects, proposals et project_images.

**Fichier** : `supabase/migrations/003_create_projects_table.sql`

**Inclut** :
- Table `projects` avec ENUM project_status
- Table `proposals` pour les soumissions
- Table `project_images` pour les photos
- Bucket Storage `projects` (public)
- Triggers automatiques pour `proposals_count`
- Function `increment_project_views()` pour compteur de vues
- RLS complet sur toutes les tables

### Triggers automatiques

#### Update proposals count
Calcul automatique de `proposals_count` lors de l'ajout/suppression d'une proposition.

```sql
CREATE TRIGGER update_proposals_count_on_change
  AFTER INSERT OR DELETE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_project_proposals_count();
```

#### Increment views
Function pour incrémenter le compteur de vues :

```sql
SELECT increment_project_views('project-uuid');
```

## Sécurité (RLS)

### Table `projects`

**Lecture** :
- Tout le monde peut lire les projets avec `status = 'open'`
- Les clients peuvent lire leurs propres projets (tous statuts)

**Écriture** :
- Seuls les clients peuvent créer des projets
- Les clients peuvent modifier/supprimer leurs propres projets

### Table `proposals`

**Lecture** :
- Le professionnel peut lire ses propositions
- Le client propriétaire du projet peut lire toutes les propositions

**Écriture** :
- Seuls les professionnels vérifiés RBQ peuvent soumettre
- Une seule proposition par professionnel par projet
- Les professionnels peuvent modifier/retirer leurs propositions

### Table `project_images`

**Lecture** :
- Tout le monde peut voir les images des projets ouverts
- Les clients peuvent voir les images de leurs propres projets

**Écriture** :
- Seuls les propriétaires du projet peuvent gérer les images

## UX/UI

### Design

#### Layout
- **En-tête** : Navigation fixe
- **Hero** : Titre, description, barre de recherche, statistiques
- **Contenu** : Sidebar de filtres + liste de cartes
- **Pied de page** : Footer global

#### Responsive
- **Desktop** : Sidebar + cartes pleine largeur
- **Tablet** : Sidebar + cartes pleine largeur
- **Mobile** : Filtres repliables + cartes pleine largeur

#### Couleurs de statut
- **Open** : Vert (bg-green-100 text-green-800)
- **In Progress** : Bleu (bg-blue-100 text-blue-800)
- **Completed** : Gris (bg-gray-100 text-gray-800)
- **Cancelled** : Rouge (bg-red-100 text-red-800)

### Interactions

1. **Recherche** : Mise à jour en temps réel
2. **Filtres** : Application immédiate
3. **Hover cards** : Élévation au survol
4. **Boutons** : Effets de transition
5. **Loading** : Skeleton screens
6. **Dates** : Format relatif pour mieux comprendre

## Workflow utilisateur

### Pour les clients

1. **Publier un projet** (futur) :
   - Se connecter
   - Remplir le formulaire de projet
   - Ajouter photos (optionnel)
   - Publier

2. **Gérer les propositions** :
   - Voir les propositions reçues
   - Comparer les offres
   - Accepter une proposition
   - Communiquer avec le professionnel

### Pour les professionnels

1. **Découvrir des projets** :
   - Parcourir la marketplace `/projects`
   - Utiliser les filtres (région, catégorie, budget)
   - Voir les détails du projet

2. **Soumettre une proposition** :
   - Se connecter (compte professionnel vérifié)
   - Cliquer sur "Soumettre une proposition"
   - Rédiger le message
   - Indiquer budget et durée estimés
   - Envoyer

3. **Suivre ses propositions** :
   - Dashboard des propositions envoyées
   - Statut : En attente, Acceptée, Refusée

## Améliorations futures

### Court terme
- [ ] Page de détails du projet (`/project/:id`)
- [ ] Formulaire de création de projet pour clients
- [ ] Formulaire de soumission de proposition
- [ ] Pagination des résultats
- [ ] Upload d'images pour les projets

### Moyen terme
- [ ] Dashboard client (gérer ses projets)
- [ ] Dashboard professionnel (gérer ses propositions)
- [ ] Système de messagerie intégrée
- [ ] Notifications en temps réel
- [ ] Système de favoris/watch list
- [ ] Alertes par email pour nouveaux projets

### Long terme
- [ ] Matching IA (suggérer projets aux pros)
- [ ] Système de recommandation
- [ ] Intégration calendrier
- [ ] Gestion des contrats
- [ ] Système de paiements par jalons
- [ ] Évaluations post-projet

## Tests

### Tests fonctionnels

#### Recherche
- [ ] Recherche par titre
- [ ] Recherche par description
- [ ] Recherche par catégorie
- [ ] Recherche insensible à la casse

#### Filtres
- [ ] Filtre par catégorie
- [ ] Filtre par région
- [ ] Filtre par budget
- [ ] Combinaison de filtres
- [ ] Réinitialisation

#### Tri
- [ ] Tri par date (récents)
- [ ] Tri par budget (élevé/faible)
- [ ] Tri par propositions

#### Affichage
- [ ] Affichage des cartes projets
- [ ] Format de budget correct
- [ ] Dates relatives
- [ ] État de chargement
- [ ] État vide
- [ ] Responsive

#### Navigation
- [ ] Clic sur "Voir les détails"
- [ ] Clic sur "Soumettre une proposition"
- [ ] Navigation via navbar

### Tests de sécurité

- [ ] RLS : Seuls les projets ouverts sont visibles publiquement
- [ ] RLS : Les clients voient leurs propres projets
- [ ] RLS : Les propositions sont privées
- [ ] Validation des budgets (max >= min)
- [ ] Seuls les clients peuvent créer des projets

## Analytics

Métriques à suivre :
- Nombre de projets publiés
- Taux de conversion (projet → proposition)
- Temps moyen avant première proposition
- Catégories les plus populaires
- Fourchettes de budget les plus communes
- Taux d'acceptation des propositions

## Configuration rapide

### 1. Appliquer la migration

```sql
-- Dans Supabase > SQL Editor
-- Copier et exécuter :
supabase/migrations/003_create_projects_table.sql
```

### 2. Créer des projets de test

```sql
-- Créer un projet de test
INSERT INTO projects (
  client_id,
  title,
  description,
  category,
  budget_min,
  budget_max,
  city,
  region,
  status
) VALUES (
  'uuid-d-un-client',
  'Rénovation complète cuisine',
  'Je souhaite rénover ma cuisine au complet avec nouveaux armoires, comptoirs et électroménagers.',
  'Cuisine et salle de bain',
  15000,
  25000,
  'Montréal',
  'Montréal',
  'open'
);
```

### 3. Tester

Visitez : `http://localhost:8080/projects`

## Support

Pour toute question :
- Guide d'installation : `INSTALLATION.md`
- Documentation professionnels : `docs/marketplace.md`
- Configuration Supabase : `supabase/README.md`

