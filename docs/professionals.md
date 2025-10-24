# Fonctionnalités Entrepreneurs

## Inscription & Conformité
- Fournir RBQ/assurances/permis (Profil > RBQ/Assurance). Les champs d'expiration `rbq_expires_at` et `insurance_expires_at` permettent des rappels.

## Profil professionnel
- Page: `/pro/profile`
- Champs: services, zones (ville/région), bio, site, tarifs (horaire/journalier), disponibilité, budget minimum, distance, temps de réponse.
- Portfolio: ajoutez des réalisations (titre, image, date, catégorie).

## Abonnements
- Page: `/pro/subscription`
- Plans: Gratuit (visibilité de base), Premium (boost visibilité, statistiques). Enregistre dans `subscriptions`.

## Parcourir projets & Soumettre un devis
- Page: `/projects`
- Les professionnels vérifiés RBQ voient le bouton “Soumettre une proposition” sur chaque projet.
- Le devis inclut message, budget estimé, durée estimée.

## Contrats standards
- Pages: `/contracts` (sélection/modèles), builder et viewer existants.
- Milestones: `contract_milestones` pour jalons, avec fonction `request_milestone_validation`.

## Messagerie
- Fonction: `get_or_create_conversation` (Supabase) pour échanger avec les clients.
- Boutons de contact disponibles depuis la marketplace/projets.

## KPIs
- Page: `/pro/kpis` – Taux d'acceptation (proposals), satisfaction (reviews), autres à venir.

## Conformité & Alertes
- Champs d’expiration sur profil (`rbq_expires_at`, `insurance_expires_at`). Une fonction `notify_compliance_expiry()` peut alimenter des notifications.

## Sous-traitants
- Page: `/pro/subcontractors` – Inviter et lister les sous-traitants.
- Tables: `subcontractors`, `subcontractor_tasks` (visibilité restreinte).

## Médiation
- Table `mediations` pour contester une évaluation (review) – statut et raison.

