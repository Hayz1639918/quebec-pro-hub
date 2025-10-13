# Marketplace des Professionnels — BâtirNet

## Vue d'ensemble

La marketplace est une page dédiée permettant aux utilisateurs de découvrir et rechercher des entrepreneurs qualifiés RBQ. Elle offre des fonctionnalités de recherche avancée, de filtrage et de tri pour faciliter la sélection du professionnel idéal.

## Accès

**URL** : `/professionals`

**Navigation** : 
- Bouton "Trouver un professionnel" dans la barre de navigation
- Section Hero de la page d'accueil
- Call-to-action sur la page d'accueil

## Fonctionnalités

### 1. Recherche

**Barre de recherche principale** :
- Recherche en temps réel
- Recherche par :
  - Nom du professionnel
  - Nom de l'entreprise
  - Services offerts

### 2. Filtres

#### Type de service
- Tous les services (par défaut)
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

#### Région
- Toutes les régions (par défaut)
- Montréal
- Québec
- Laval
- Gatineau
- Longueuil
- Sherbrooke
- Saguenay
- Trois-Rivières
- Terrebonne
- Saint-Jean-sur-Richelieu

#### Tri
- **Plus récents** : Professionnels récemment inscrits
- **Nom (A-Z)** : Tri alphabétique par nom d'entreprise
- **Meilleures notes** : Tri par note moyenne décroissante

### 3. Affichage des résultats

Chaque carte de professionnel affiche :

#### Informations principales
- **Logo de l'entreprise** (si disponible)
- **Nom de l'entreprise**
- **Nom du professionnel**
- **Badge de vérification RBQ** ✓ Vérifié

#### Détails
- **Numéro RBQ** : Certification officielle
- **Localisation** : Ville et région
- **Expérience** : Nombre d'années d'expérience
- **Services** : Liste des services offerts (max 3 badges + compteur)
- **Note moyenne** : Étoiles sur 5
- **Nombre d'avis** : Total des évaluations
- **Projets réalisés** : Nombre de projets complétés

#### Actions
- **Voir le profil** : Navigation vers la page de profil détaillée
- **Téléphone** : Bouton de contact rapide
- **Email** : Bouton d'envoi d'email

### 4. États

#### Chargement
- Affichage de cartes en mode "skeleton" pendant le chargement

#### Aucun résultat
- Message informatif
- Suggestion de réinitialiser les filtres
- Bouton de réinitialisation rapide

#### Vide
Si aucun professionnel n'est vérifié dans la base de données, un message approprié est affiché.

## Architecture technique

### Composant
`src/pages/Professionals.tsx`

### Types TypeScript
```typescript
interface Professional {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string;
  rbq_number: string;
  services_offered: string | null;
  insurance_info: string | null;
  is_rbq_verified: boolean;
  city: string | null;
  region: string | null;
  bio: string | null;
  years_experience: number | null;
  average_rating: number;
  total_reviews: number;
  total_projects: number;
  profile_picture_url: string | null;
  created_at: string;
}
```

### Requête Supabase

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_type', 'professional')
  .eq('is_rbq_verified', true)  // Uniquement les professionnels vérifiés
  .order('created_at', { ascending: false });
```

### Logique de filtrage

1. **Recherche textuelle** : Filtre par nom, entreprise et services
2. **Service** : Recherche dans le champ `services_offered`
3. **Région** : Recherche dans `city` et `region`
4. **Tri** : Application du tri sélectionné

## Base de données

### Tables utilisées

#### `profiles`
Stocke les informations des professionnels.

**Champs marketplace** :
- `user_type` : Doit être 'professional'
- `is_rbq_verified` : Doit être true pour apparaître
- `city` : Ville du professionnel
- `region` : Région du professionnel
- `bio` : Description du professionnel
- `years_experience` : Années d'expérience
- `average_rating` : Note moyenne (0-5)
- `total_reviews` : Nombre total d'avis
- `total_projects` : Nombre de projets réalisés
- `profile_picture_url` : Photo de profil

#### `reviews`
Stocke les évaluations des professionnels par les clients.

**Champs** :
- `professional_id` : Référence au professionnel
- `client_id` : Référence au client
- `rating` : Note globale (1-5)
- `quality_rating` : Note qualité (1-5)
- `punctuality_rating` : Note ponctualité (1-5)
- `communication_rating` : Note communication (1-5)
- `value_rating` : Note rapport qualité/prix (1-5)
- `comment` : Commentaire textuel

#### `portfolio_items`
Stocke les exemples de travaux des professionnels.

**Champs** :
- `professional_id` : Référence au professionnel
- `title` : Titre du projet
- `description` : Description
- `image_url` : URL de l'image
- `project_date` : Date du projet
- `category` : Catégorie du projet

### Migrations

#### Migration 001
Création de la table `profiles` de base avec les champs essentiels.

**Fichier** : `supabase/migrations/001_create_profiles_table.sql`

#### Migration 002
Ajout des champs marketplace :
- Localisation (city, region, postal_code)
- Métriques (average_rating, total_reviews, total_projects)
- Informations additionnelles (bio, years_experience, website_url)
- Tables reviews et portfolio_items

**Fichier** : `supabase/migrations/002_add_marketplace_fields.sql`

### Triggers automatiques

#### Update rating
Calcul automatique de `average_rating` et `total_reviews` lors de l'ajout/modification/suppression d'un avis.

```sql
CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();
```

## UX/UI

### Design

#### Layout
- **En-tête** : Navigation fixe
- **Hero** : Titre, description, barre de recherche, statistiques
- **Contenu** : Sidebar de filtres + grille de résultats
- **Pied de page** : Footer global

#### Responsive
- **Desktop** : Sidebar + grille 2 colonnes
- **Tablet** : Sidebar + grille 2 colonnes
- **Mobile** : Filtres repliables + grille 1 colonne

#### Couleurs
- **Primary** : Boutons et badges de vérification
- **Secondary** : Badges de services
- **Yellow** : Étoiles de notation
- **Muted** : Textes secondaires

### Interactions

1. **Recherche** : Mise à jour en temps réel
2. **Filtres** : Application immédiate
3. **Hover cards** : Élévation au survol
4. **Boutons** : Effets de transition
5. **Loading** : Skeleton screens

## Améliorations futures

### Court terme
- [ ] Pagination des résultats
- [ ] Sauvegarde des favoris
- [ ] Comparaison de professionnels
- [ ] Partage de profils

### Moyen terme
- [ ] Filtres avancés (prix, disponibilité, distance)
- [ ] Carte interactive avec géolocalisation
- [ ] Demande de devis en ligne
- [ ] Système de messagerie intégrée
- [ ] Notifications de nouveaux professionnels

### Long terme
- [ ] Matching IA basé sur le projet
- [ ] Recommandations personnalisées
- [ ] Intégration calendrier de disponibilités
- [ ] Réservation de consultations
- [ ] Badge "Professionnel réactif"

## Tests

### Tests fonctionnels

#### Recherche
- [ ] Recherche par nom d'entreprise
- [ ] Recherche par nom de professionnel
- [ ] Recherche par service
- [ ] Recherche avec caractères spéciaux
- [ ] Recherche insensible à la casse

#### Filtres
- [ ] Filtre par service
- [ ] Filtre par région
- [ ] Combinaison de filtres
- [ ] Réinitialisation des filtres

#### Tri
- [ ] Tri par date (récents)
- [ ] Tri par nom (A-Z)
- [ ] Tri par note

#### Affichage
- [ ] Affichage des cartes professionnels
- [ ] Affichage correct des notes
- [ ] Affichage des badges
- [ ] État de chargement
- [ ] État vide
- [ ] Responsive mobile/tablet/desktop

#### Navigation
- [ ] Clic sur "Voir le profil"
- [ ] Retour à la page d'accueil
- [ ] Navigation via navbar

### Tests de performance

- [ ] Chargement de 100+ professionnels
- [ ] Recherche avec filtres multiples
- [ ] Rendu responsive
- [ ] Optimisation des images

### Tests de sécurité

- [ ] RLS : Seuls les professionnels vérifiés sont visibles
- [ ] Validation des entrées de recherche
- [ ] Protection contre les injections SQL

## Analytics

Métriques à suivre :
- Nombre de visites de la page
- Recherches les plus fréquentes
- Filtres les plus utilisés
- Taux de clic sur les profils
- Temps passé sur la page
- Taux de conversion (recherche → contact)

## Documentation technique

### Dépendances

**UI Components** :
- `@/components/ui/card` : Cartes de professionnels
- `@/components/ui/input` : Barre de recherche
- `@/components/ui/select` : Filtres déroulants
- `@/components/ui/badge` : Badges de services et vérification
- `lucide-react` : Icônes

**Router** :
- `react-router-dom` : Navigation

**Backend** :
- `@supabase/supabase-js` : Requêtes base de données

### Performance

**Optimisations** :
- Debounce sur la recherche (300ms)
- Lazy loading des images
- Memoization des résultats filtrés
- Index de base de données sur les champs de recherche

**Temps de chargement cible** :
- Initial load : < 2s
- Recherche : < 500ms
- Filtres : < 300ms

## Support

Pour toute question :
- Guide d'installation : `INSTALLATION.md`
- Documentation API : `docs/architecture.md`
- Configuration Supabase : `supabase/README.md`

