# Audit des User Stories Client — Module A

> **Date :** 5 mars 2026
> **Analysé par :** Claude Code (Sonnet 4.6)
> **Périmètre :** 46 user stories — Module A (Client)

---

## Légende des statuts

| Statut | Signification |
|---|---|
| ✅ **Implémentée** | Fonctionnalité présente et conforme aux critères d'acceptation |
| ⚠️ **Partielle** | Implémentée mais avec des écarts aux critères ou des lacunes importantes |
| ❌ **Absente** | Non implémentée |

---

## Résumé exécutif

| Statut | Nombre | % |
|---|---|---|
| ✅ Implémentée | 16 | 35% |
| ⚠️ Partielle | 17 | 37% |
| ❌ Absente | 13 | 28% |
| **Total** | **46** | **100%** |

---

## Epic 1 — Inscription, Authentification et Profil Utilisateur

### US-001 — Inscription email/mot de passe
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/Auth.tsx:98-182`

Inscription email/password fonctionnelle avec sélection du type (Client/Professionnel). Toutefois, la validation du mot de passe est insuffisante : le critère exige 8+ caractères avec majuscule, chiffre et caractère spécial, mais l'implémentation n'applique qu'un `minLength={6}` via l'attribut HTML natif (ligne 358). Aucune regex de complexité n'est vérifiée côté code.

```tsx
// ❌ Seule règle : 6 caractères minimum — pas de complexité
<Input type="password" minLength={6} required />
```

**Critères manquants :** 8+ caractères, majuscule obligatoire, chiffre obligatoire, caractère spécial obligatoire.

---

### US-002 — Inscription via Google ou Apple
**Statut : ❌ Absente**

**Fichier :** `src/pages/Auth.tsx`

Aucun bouton de connexion OAuth Google/Apple dans `Auth.tsx`. Les clés de traduction existent dans `fr.json` et `en.json` (traces d'une intention), mais aucune implémentation avec `supabase.auth.signInWithOAuth()` n'est présente dans le code.

**Critères manquants :** OAuth 2.0 Google, OAuth 2.0 Apple, création automatique du profil, redirection.

---

### US-003 — Vérification par OTP
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/Auth.tsx:134-145`

Une confirmation d'email est implémentée via Supabase (envoi d'un lien `emailRedirectTo`), mais ce n'est **pas un OTP à 6 chiffres**. C'est un lien magique de confirmation. Pas de SMS OTP, pas de champ de saisie à 6 chiffres, pas d'expiration configurable à 5 minutes côté UI, pas de bouton de renvoi.

**Critères manquants :** OTP 6 chiffres, interface de saisie OTP, expiration 5 min visible, option renvoi, confirmation par SMS.

---

### US-004 — Connexion email/mot de passe
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/Auth.tsx:184-252`

Connexion via `supabase.auth.signInWithPassword()` fonctionnelle. Champ email, mot de passe masqué (type="password"), messages d'erreur via toast. Redirection intelligente selon le statut du profil (client → /dashboard, professionnel → selon vérification RBQ).

---

### US-005 — Réinitialisation du mot de passe
**Statut : ❌ Absente**

**Fichier :** `src/pages/Auth.tsx`

Le lien "Mot de passe oublié ?" existe dans les fichiers de traduction (`fr.json:152`) mais **n'est pas rendu dans le composant `Auth.tsx`**. Aucun bouton, aucune page de reset, aucun appel à `supabase.auth.resetPasswordForEmail()` dans tout le codebase.

**Critères manquants :** Bouton "Mot de passe oublié", envoi OTP/lien reset, formulaire nouveau mot de passe, validation des règles de sécurité.

---

### US-006 — Gestion du profil utilisateur
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/ClientProfile.tsx`

Modification de : nom, téléphone, email (affiché), adresse, ville, région, code postal. Fonctionnelle.

**Critères manquants :**
- Pas d'**upload de photo de profil** (aucun champ `profile_picture_url` dans le formulaire client)
- Pas de **choix de langue par utilisateur** dans le profil (la langue est un paramètre global non lié au compte)
- Pas de **gestion des préférences de notifications** dans cette page

---

### US-007 — Modification mot de passe et comptes liés
**Statut : ❌ Absente**

Aucune page ni composant ne permet de changer le mot de passe une fois connecté, ni de gérer les comptes OAuth liés (Google, LinkedIn). `supabase.auth.updateUser()` n'est appelé nulle part dans le codebase pour un changement de mot de passe authentifié.

---

## Epic 2 — Onboarding et Navigation

### US-008 — Écran splash
**Statut : ❌ Absente**

Application web — pas d'écran splash animé. Le `PageLoader` de `App.tsx:50-57` est un spinner générique, pas un écran de marque avec le logo BâtirNet animé.

---

### US-009 — Écrans d'onboarding
**Statut : ❌ Absente**

Aucun composant d'onboarding (caroussel 4 écrans, boutons Suivant/Passer) dans le codebase.

---

### US-010 — Écran d'accueil avec projets actifs et actions rapides
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/Dashboard.tsx:151-`

Dashboard complet avec : message de bienvenue personnalisé (`profile.full_name`), statistiques (projets actifs, total, soumissions reçues, favoris), onglets (Vue d'ensemble, Projets, Soumissions, Favoris, Activité), bouton "Nouveau projet", accès rapide aux contrats en attente et rapports de suivi.

---

### US-011 — Barre de navigation inférieure
**Statut : ⚠️ Partielle**

**Fichier :** `src/components/Navigation.tsx`

Navigation présente avec les 4 sections principales (Accueil, Projets, Messages, Profil) mais sous forme de **barre horizontale supérieure** (desktop-first). Sur mobile, c'est un menu hamburger via un drawer. Les critères spécifient une barre de navigation **inférieure** persistante (mobile UX pattern), ce qui n'est pas implémenté.

---

## Epic 3 — Création et Gestion de Projets

### US-012 — Créer un nouveau projet
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/NewProject.tsx`

Formulaire riche avec 9 sections : informations de base, budget, localisation, dates, critères d'évaluation, documents requis, exigences d'assurance, options avancées, fichiers. Très complet sur le fond.

**Écarts :** Le formulaire est une **page linéaire scrollable**, pas un formulaire **multi-étapes à 5 étapes** avec validation champ par champ entre les étapes (progress stepper). L'UX est différente des critères d'acceptation.

---

### US-013 — Sélection de localisation
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/NewProject.tsx:166-207`

Auto-géocodage par code postal via **OpenStreetMap/Nominatim** (pas Google Maps). Saisie manuelle fonctionnelle (ville, région, code postal). La géolocalisation automatique du projet par GPS de l'utilisateur n'est pas proposée dans ce formulaire.

**Critères manquants :** Intégration Google Maps (carte interactive de sélection), auto-détection GPS de la position actuelle.

---

### US-014 — Budget et préférences de paiement
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/NewProject.tsx:572-606`

Fourchette budgétaire (min/max) implémentée avec deux champs `<Input type="number">`.

**Critères manquants :** Slider de budget (spécifié dans les critères), boutons radio pour le **mode de paiement** (paiement total, versements, négociable) — absents du formulaire.

---

### US-015 — Upload de fichiers
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/NewProject.tsx:241-270`

Upload multi-fichiers (PDF, JPG, PNG), validation du type MIME, limite à 5 fichiers et 5 MB par fichier, prévisualisation des noms, bouton de suppression individuel, upload vers Supabase Storage.

---

### US-016 — Type d'entrepreneur et certifications requises
**Statut : ❌ Absente**

**Fichier :** `src/pages/NewProject.tsx`

Le formulaire ne contient **aucun champ** pour spécifier le type d'entrepreneur préféré (individuel vs entreprise) ni les certifications requises (RBQ, assurance). Il existe des cases à cocher pour les documents à soumettre (`DEFAULT_REQUIRED_DOCUMENTS`) qui incluent "Copie de la licence RBQ" et "Certificats d'assurance", mais ce ne sont pas des filtres sur le profil de l'entrepreneur.

---

### US-017 — Matching IA
**Statut : ❌ Absente**

Aucun toggle IA, aucun algorithme de recommandation, aucune fonctionnalité de matching automatisé dans le codebase.

---

### US-018 — Tableau de bord des projets
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/Dashboard.tsx`, `src/components/dashboard/ProjectList.tsx`

Liste de projets avec statut (open, in_progress, completed, cancelled), badges colorés, compteur de soumissions, date, barre de progression pour les projets actifs, accès au détail.

---

### US-019 — Détail d'un projet
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/ProjectDetails.tsx`

Vue détaillée avec : informations de base (titre, catégorie, budget, localisation, statut), images uploadées avec galerie, soumission acceptée (entrepreneur, montant, délai), contrat associé (statut, signatures), rapports de suivi du chantier, formulaire de soumission pour les professionnels.

---

### US-020 — Approuver ou réviser un jalon
**Statut : ⚠️ Partielle**

**Fichiers :** `src/pages/ProContracts.tsx`, `supabase/migrations/011_add_contract_milestones.sql`

La table `contract_milestones` existe avec des statuts (`pending`, `in_progress`, `completed`, `approved`, `paid`). La page `ProContracts.tsx` affiche les jalons côté professionnel. Cependant, il **n'existe pas de bouton "Approuver" / "Demander une révision"** accessible au client dans `Dashboard.tsx` ou `ProjectDetails.tsx`. L'approbation côté client des jalons n'est pas exposée dans l'interface.

---

## Epic 4 — Recherche et Matching d'Entrepreneurs

### US-021 — Liste d'entrepreneurs après soumission du projet
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/NewProject.tsx:421-426`

Après soumission, l'utilisateur est redirigé vers `/dashboard` (pas vers une liste de professionnels correspondants). Il n'y a pas de résultats filtrés automatiquement selon la catégorie/budget/localisation du projet nouvellement créé. La page `/professionals` existe mais n'est pas pré-filtrée selon le projet.

---

### US-022 — Filtres de recherche des entrepreneurs
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/Professionals.tsx:119-401`

Filtres implémentés : service, région, budget (taux horaire), disponibilité, temps de réponse. Tri par : récent, nom, note, proximité GPS, activité. Carte interactive avec rayon configurable (défaut 50 km). Recherche textuelle en temps réel.

**Écart mineur :** Le filtre de distance (10/25/50 km) est géré via le rayon de la carte, pas via un selector explicite dans la sidebar.

---

### US-023 — Profil complet d'un entrepreneur
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/ProfessionalProfile.tsx`

Page dédiée avec : photo/avatar, nom, entreprise, biographie, numéro RBQ, certifications, ville/région, statistiques (propositions, projets acceptés, note moyenne, nombre d'avis), badge de vérification RBQ, bouton de contact (messagerie).

**Écart :** Pas de galerie portfolio visible dans `ProfessionalProfile.tsx` (la migration `017_add_portfolio.sql` et `ProPortfolio.tsx` existent côté pro, mais ne sont pas affichés dans le profil public du professionnel).

---

### US-024 — Favoris
**Statut : ✅ Implémentée**

**Fichiers :** `src/components/FavoriteButton.tsx`, `src/components/dashboard/FavoritesList.tsx`, `src/pages/Dashboard.tsx`

Bouton favori (cœur) sur chaque carte professionnelle dans la liste, liste des favoris dans le dashboard avec détails du professionnel, comparaison possible via `CompareDialog.tsx`.

---

### US-025 — Recherche par nom/expertise
**Statut : ✅ Implémentée**

**Fichier :** `src/pages/Professionals.tsx:278-285`

Barre de recherche textuelle filtrant sur `full_name`, `company_name`, `services_offered`. Résultats mis à jour à chaque frappe (réactif via `useEffect`).

**Écart :** Pas d'auto-complétion (les résultats se filtrent mais sans dropdown de suggestions).

---

## Epic 5 — Communication et Réunions

### US-026 — Messagerie temps réel
**Statut : ✅ Implémentée**

**Fichier :** `src/components/messaging/ChatWindow.tsx`

Chat temps réel via Supabase Realtime (PostgreSQL LISTEN/NOTIFY), accusés de lecture (`markMessageAsRead`), horodatage, pagination (50 messages par page), scroll automatique, indicateur de chargement, déduplication des messages.

---

### US-027 — Partage de fichiers et localisation dans le chat
**Statut : ❌ Absente**

**Fichier :** `src/components/messaging/ChatWindow.tsx`

Le ChatWindow permet uniquement l'envoi de **messages texte**. Aucun bouton d'upload de fichiers, aucun partage de position GPS dans l'interface de chat. La base de données a un champ `attachment_url` dans la table `messages` (visible dans les types), mais l'UI ne l'expose pas.

---

### US-028 — Planification de réunion Zoom
**Statut : ❌ Absente**

Aucune intégration Zoom, aucun calendrier de disponibilités, aucune génération de lien de réunion dans le codebase.

---

### US-029 — Bloquer/signaler un entrepreneur depuis le chat
**Statut : ⚠️ Partielle**

**Fichier :** `src/components/messaging/ChatWindow.tsx:14`

Le menu `MoreVertical` avec `DropdownMenu` est importé dans ChatWindow. Il existe une fonctionnalité de **suppression de message** (icône `Trash2`) mais aucune option "Bloquer" ou "Signaler" l'utilisateur n'est visible dans le code parcouru.

---

### US-030 — Demande de devis depuis le chat
**Statut : ❌ Absente**

Aucun bouton "Demander un devis" dans l'interface de chat. La fonctionnalité passe par la page de projet (soumission de proposition) mais pas directement depuis la messagerie.

---

## Epic 6 — Contrats, Paiements et Facturation

### US-031 — Consultation du contrat numérique
**Statut : ✅ Implémentée**

**Fichiers :** `src/components/contracts/ContractViewer.tsx`, `src/components/contracts/ContractTemplates.tsx`, `src/components/contracts/ContractBuilder.tsx`

Système de contrats complet : templates APCHQ-style (migration `026`), constructeur de contrats avec sections (portée, conditions, paiement, jalons, responsabilités, résolution de litiges), visualisation du contrat formaté.

---

### US-032 — Signature électronique
**Statut : ✅ Implémentée**

**Fichier :** `src/components/contracts/ESignature.tsx`

E-signature via canvas (dessin libre) ou saisie typographique, confirmation des deux parties requise, horodatage, hash SHA-256 du document et de la signature, audit trail, code de vérification unique.

---

### US-033 — Téléchargement du contrat en PDF
**Statut : ✅ Implémentée**

**Fichiers :** `src/lib/contract-pdf-generator.ts`, `src/components/pdf/ProposalPDF.tsx`

Génération PDF via `@react-pdf/renderer`, format professionnel avec toutes les clauses, bouton de téléchargement dans `ContractViewer.tsx`.

---

### US-034 — Paiement par carte/virement/crypto
**Statut : ❌ Absente**

**Fichier :** `src/pages/Dashboard.tsx`, `src/pages/Contracts.tsx`

**Aucune intégration de paiement** n'est implémentée. Pas de Stripe, pas de PayPal, pas de crypto. Les montants des contrats sont affichés mais le paiement réel n'est pas traité. La documentation `docs/payments.md` décrit l'architecture prévue mais elle n'est pas codée.

---

### US-035 — Paiements par jalons avec escrow
**Statut : ⚠️ Partielle**

**Fichier :** `supabase/migrations/011_add_contract_milestones.sql`

La table `contract_milestones` avec des statuts (`pending`, `in_progress`, `completed`, `approved`, `paid`) et `payment_amount` est en place. L'interface `ContractBuilder.tsx` permet de définir des jalons. Mais **aucun système d'escrow ni de déclenchement de paiement réel** n'est implémenté (dépend de US-034 qui est absent).

---

### US-036 — Historique des transactions et téléchargement de factures
**Statut : ❌ Absente**

Il n'y a pas de module de transactions/factures. Le Dashboard affiche les montants de contrats mais pas un historique de paiements avec statuts (payé, en attente, remboursé) ni un bouton de téléchargement de facture PDF.

---

## Epic 7 — Avis, Évaluations et Recommandations

### US-037 — Noter un entrepreneur
**Statut : ⚠️ Partielle**

**Fichier :** `src/integrations/supabase/types.ts`

La table `reviews` est bien structurée avec `rating`, `quality_rating`, `punctuality_rating`, `communication_rating`, `value_rating`, `comment`. Côté professionnel, `ProReviews.tsx` affiche les avis reçus. Cependant, **aucun formulaire côté client** pour soumettre un avis n'est visible — pas de page dédiée, pas de composant de soumission d'évaluation accessible depuis le Dashboard ou ProjectDetails.

---

### US-038 — Marquer un projet comme terminé
**Statut : ⚠️ Partielle**

**Fichier :** `src/pages/Dashboard.tsx`, `src/pages/ProjectDetails.tsx`

Le statut `completed` existe dans le modèle de données. Côté professionnel (`ProMyProjects.tsx:137`), des fonctions de changement de statut sont visibles. Côté client, **aucun bouton "Marquer comme terminé"** n'est exposé dans le Dashboard ou ProjectDetails, et le déclenchement automatique du formulaire d'évaluation n'est pas implémenté.

---

### US-039 — Recommandations post-projet
**Statut : ❌ Absente**

Aucun écran de recommandations post-projet (Réembaucher, Référer, Nouveau projet, suggestions d'entrepreneurs similaires).

---

### US-040 — Signaler un avis inapproprié
**Statut : ❌ Absente**

Pas de bouton "Signaler" sur les avis. Un système de médiation existe (`supabase/migrations/014_add_mediation.sql`, `ProReviews.tsx`) qui permet au **professionnel** de contester un avis, mais le client ne peut pas signaler un avis comme inapproprié.

---

## Epic 8 — Notifications

### US-041 — Notifications push pour mises à jour
**Statut : ✅ Implémentée**

**Fichiers :** `src/pages/Notifications.tsx`, `src/components/NotificationBell.tsx`

Notifications en temps réel via Supabase Realtime + polling de backup (10s). Types supportés : message, proposition, proposition acceptée/refusée, contrat créé/signé, paiement, avis, jalons, rbq_verified/rejected. Cliquables vers la section concernée (`action_url`). Badge de compteur non lus sur la cloche.

---

### US-042 — Gestion des préférences de notifications
**Statut : ❌ Absente**

**Fichier :** `src/pages/ClientProfile.tsx`

Aucun toggle par catégorie de notification dans les paramètres du profil. L'utilisateur reçoit toutes les notifications sans possibilité de filtrer par type.

---

## Epic 9 — Cycle de Vie de Projet et Suivi

### US-043 — Voir les propositions avec comparaison
**Statut : ✅ Implémentée**

**Fichiers :** `src/components/dashboard/ProposalsList.tsx`, `src/components/dashboard/CompareDialog.tsx`

Liste de propositions dans le dashboard avec entrepreneur, entreprise, budget estimé, délai, statut. Boîte de dialogue de comparaison côte à côte (`CompareDialog.tsx`) accessible depuis la liste des favoris.

**Écart mineur :** La comparaison directe de propositions (pas de favoris) n'est pas exposée — `CompareDialog` compare des favoris, pas les propositions reçues sur un projet spécifique.

---

### US-044 — Accepter une proposition
**Statut : ✅ Implémentée**

**Fichier :** `src/components/dashboard/ProposalsList.tsx:101-179`

Boutons Accepter/Refuser avec dialogue de confirmation, appel aux RPCs SQL sécurisées `accept_proposal` et `reject_proposal`, toast de succès, redirection vers l'onglet projets après acceptation.

---

### US-045 — Suivi de la progression en temps réel
**Statut : ⚠️ Partielle**

**Fichiers :** `src/pages/ProjectProgress.tsx` (côté pro), `src/pages/Dashboard.tsx` (côté client)

Le Dashboard client affiche `progress_percentage`, `progress_status`, `current_phase`, et les rapports de chantier soumis par le professionnel. La page `ProjectProgress.tsx` est côté professionnel (pour mettre à jour l'avancement).

**Écart :** Il n'y a **pas de page dédiée côté client** pour voir la timeline visuelle du projet avec mises à jour média (photos/vidéos du chantier). Les rapports sont visibles sous forme de liste textuelle dans le Dashboard, pas sous forme de timeline visuelle interactive.

---

### US-046 — Signaler un problème
**Statut : ⚠️ Partielle**

**Fichier :** `supabase/migrations/014_add_mediation.sql`, `src/pages/ProReviews.tsx`

Un système de médiation est en place dans la base de données (`mediation_requests` table). Côté professionnel, il est exposé dans `ProReviews.tsx` pour contester des avis. Cependant, **côté client**, il n'y a pas de bouton "Signaler un problème" dans le Dashboard ou dans `ProjectDetails.tsx` qui permettrait de déclencher une demande de médiation ou d'alerte admin pour un retard ou un problème de qualité.

---

## Tableau récapitulatif complet

| ID | User Story | Statut | Fichier principal | Problème principal |
|---|---|---|---|---|
| US-001 | Inscription email/password | ⚠️ Partielle | `Auth.tsx:98` | Validation MDP trop faible (6 car., pas de complexité) |
| US-002 | Inscription Google/Apple | ❌ Absente | — | OAuth non implémenté |
| US-003 | Vérification OTP | ⚠️ Partielle | `Auth.tsx:134` | Lien email, pas OTP 6 chiffres |
| US-004 | Connexion email/password | ✅ Implémentée | `Auth.tsx:184` | — |
| US-005 | Réinitialisation mot de passe | ❌ Absente | — | Aucun flux de reset |
| US-006 | Gestion du profil | ⚠️ Partielle | `ClientProfile.tsx` | Pas de photo, pas de préf. notifications |
| US-007 | Modif. MDP et comptes liés | ❌ Absente | — | Non implémenté |
| US-008 | Écran splash | ❌ Absente | — | App web, non applicable |
| US-009 | Onboarding | ❌ Absente | — | Non implémenté |
| US-010 | Dashboard accueil | ✅ Implémentée | `Dashboard.tsx` | — |
| US-011 | Barre navigation inférieure | ⚠️ Partielle | `Navigation.tsx` | Navigation supérieure, pas inférieure |
| US-012 | Créer un projet | ⚠️ Partielle | `NewProject.tsx` | Pas multi-étapes, pas de progress stepper |
| US-013 | Localisation projet | ⚠️ Partielle | `NewProject.tsx:166` | OpenStreetMap pas Google Maps |
| US-014 | Budget et paiement | ⚠️ Partielle | `NewProject.tsx:572` | Pas de slider, pas de mode de paiement |
| US-015 | Upload fichiers | ✅ Implémentée | `NewProject.tsx:241` | — |
| US-016 | Type entrepreneur/certifications | ❌ Absente | — | Champs absents du formulaire |
| US-017 | Matching IA | ❌ Absente | — | Non implémenté |
| US-018 | Dashboard projets | ✅ Implémentée | `Dashboard.tsx` | — |
| US-019 | Détail d'un projet | ✅ Implémentée | `ProjectDetails.tsx` | — |
| US-020 | Approuver/réviser jalon | ⚠️ Partielle | `ProContracts.tsx` | Pas de bouton côté client |
| US-021 | Matching après soumission | ⚠️ Partielle | `NewProject.tsx:421` | Redirection dashboard, pas matching auto |
| US-022 | Filtres entrepreneurs | ✅ Implémentée | `Professionals.tsx` | — |
| US-023 | Profil complet entrepreneur | ✅ Implémentée | `ProfessionalProfile.tsx` | Portfolio non affiché publiquement |
| US-024 | Favoris | ✅ Implémentée | `FavoriteButton.tsx` | — |
| US-025 | Recherche par nom/expertise | ✅ Implémentée | `Professionals.tsx:278` | Pas d'auto-complétion |
| US-026 | Messagerie temps réel | ✅ Implémentée | `ChatWindow.tsx` | — |
| US-027 | Partage fichiers/GPS dans chat | ❌ Absente | `ChatWindow.tsx` | UI absente (champ DB existe) |
| US-028 | Planifier réunion Zoom | ❌ Absente | — | Non implémenté |
| US-029 | Bloquer/signaler dans chat | ⚠️ Partielle | `ChatWindow.tsx` | Menu présent mais fonctions absentes |
| US-030 | Demande de devis depuis chat | ❌ Absente | — | Non implémenté |
| US-031 | Contrat numérique | ✅ Implémentée | `Contracts.tsx` | — |
| US-032 | E-signature | ✅ Implémentée | `ESignature.tsx` | — |
| US-033 | Télécharger contrat PDF | ✅ Implémentée | `contract-pdf-generator.ts` | — |
| US-034 | Paiement carte/virement/crypto | ❌ Absente | — | Aucune intégration paiement |
| US-035 | Paiements par jalons/escrow | ⚠️ Partielle | migrations/011 | Structure DB OK, pas de traitement |
| US-036 | Historique transactions/factures | ❌ Absente | — | Non implémenté |
| US-037 | Noter un entrepreneur | ⚠️ Partielle | `types.ts` | Pas de formulaire côté client |
| US-038 | Marquer projet terminé | ⚠️ Partielle | `Dashboard.tsx` | Pas de bouton côté client |
| US-039 | Recommandations post-projet | ❌ Absente | — | Non implémenté |
| US-040 | Signaler un avis | ❌ Absente | — | Non implémenté (médiation = côté pro) |
| US-041 | Notifications push | ✅ Implémentée | `Notifications.tsx` | — |
| US-042 | Préférences notifications | ❌ Absente | — | Non implémenté |
| US-043 | Voir propositions/comparaison | ✅ Implémentée | `ProposalsList.tsx` | Comparaison limitée (favoris uniquement) |
| US-044 | Accepter une proposition | ✅ Implémentée | `ProposalsList.tsx:101` | — |
| US-045 | Suivi progression temps réel | ⚠️ Partielle | `Dashboard.tsx` | Pas de timeline visuelle côté client |
| US-046 | Signaler un problème | ⚠️ Partielle | migrations/014 | Pas d'UI côté client |

---

## Recommandations prioritaires

### Priorité HAUTE (bloquant pour une livraison)

1. **US-005 — Réinitialisation mot de passe** : Fonctionnalité de sécurité critique. 1 appel `supabase.auth.resetPasswordForEmail()` + une page de reset.
2. **US-001 — Complexité du mot de passe** : Ajouter une validation Zod (`/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/`) dans `handleSignUp`.
3. **US-034 — Paiements** : Intégrer Stripe (au minimum les cartes). C'est la fonctionnalité monétaire centrale de la plateforme.
4. **US-037 + US-038 — Évaluation post-projet** : Ajouter un bouton "Marquer comme terminé" dans `ProjectDetails.tsx` qui ouvre un formulaire de notation.

### Priorité MOYENNE (amélioration significative)

5. **US-002 — Google OAuth** : 2-3 lignes avec Supabase OAuth, fort impact sur le taux d'inscription.
6. **US-027 — Fichiers dans le chat** : Le champ `attachment_url` existe en DB, il manque l'UI d'upload.
7. **US-020 — Approbation de jalons côté client** : Exposer les boutons Approuver/Réviser dans `ProjectDetails.tsx`.
8. **US-042 — Préférences notifications** : Toggle par catégorie dans `ClientProfile.tsx`.
9. **US-021 — Matching après soumission** : Rediriger vers `/professionals` pré-filtré après création de projet.
10. **US-023 — Portfolio dans le profil public** : Afficher les items de portfolio dans `ProfessionalProfile.tsx`.

### Priorité BASSE (confort / différenciation)

11. **US-012 — Formulaire multi-étapes** : Refactorer `NewProject.tsx` en stepper 5 étapes.
12. **US-029 — Bloquer dans le chat** : Ajouter les options dans le `DropdownMenu` de `ChatWindow.tsx`.
13. **US-017 — Matching IA** : Algorithme de scoring professionnel/projet.
14. **US-009 — Onboarding** : 4 écrans pour les nouveaux utilisateurs.

---

*Rapport généré le 5 mars 2026 — Basé sur l'analyse directe du code source.*
