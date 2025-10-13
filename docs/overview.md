# BâtirNet — Vision & Spécification Fonctionnelle

## Résumé
- Place de marché sécurisée (Web + mobile) connectant des clients particuliers/entreprises avec des entrepreneurs du bâtiment à l’échelle du Canada, accent Québec.
- Différenciation:
  - Matching intelligent (IA) pour recommander les meilleurs entrepreneurs.
  - Contrats intelligents (blockchain) avec e‑signature et jalons de paiement (escrow/paiements en tranches).
  - Système d’évaluation riche (ponctualité, qualité, respect des délais, communication, etc.).
  - Couche légale provinciale (vérifications RBQ/permits/assurances), conformité PIPEDA.
  - UX multilingue (FR/EN), extensible.
- Modèle d’affaires: freemium côté clients, abonnements premium côté entrepreneurs, offre VIP (accompagnement).
- Roadmap: MVP → Québec → Canada → USA/Europe.

## Fonctionnalités clés (organisées)
- Comptes & rôles: Client (gratuit), Client VIP, Entrepreneur, Sous‑traitant, Admin/Support, Légal/Conformité, Médiateur.
- Onboarding & vérifications: KYC/KYB pro, vérifs RBQ/assurances/permis par province, alertes d’expiration.
- Profils & portfolio: services, zones, photos/vidéos, certifications, preuves d’assurance, métriques qualité.
- Recherche & filtres: localisation, catégories/métiers, budget, délais, disponibilité, note moyenne, nombre d’avis, mots‑clés; tris (pertinence simple, proximité, mieux notés, plus actifs).
- Création de projet & demandes de devis: brief, budget, échéancier, pièces jointes; shortlist manuelle.
- Messagerie & notifications: fil par projet, pièces jointes, notifications temps réel.
- Contrats & e‑signature (standards): bibliothèque de modèles par type de travaux/province, clauses éditables, versioning, e‑signature, journal d’activité.
- Paiements: jalons (Stripe), déclenchement à la validation, anti‑fraude de base, factures téléchargeables.
- Évaluations & réputation: grille multi‑critères (ponctualité, qualité, respect des délais, communication).
- Médiation/litiges: ouverture de dossier, partage de preuves, décision, application (blocage/déblocage jalon).
- Multilingue & accessibilité: FR/EN (extensible), bonnes pratiques WCAG.
- Analytique & KPIs: tableaux de bord (clients, pros, admin).
- Abonnements & monétisation: freemium clients, premium pro (visibilité, stats), VIP client (accompagnement).

## Architecture & technique
- Architecture: microservices (évolutif), API REST/GraphQL selon cas d’usage.
- Données: DB relationnelle (transactions/contrats/paiements) + NoSQL (logs/activité/métriques), objets (CDN) pour médias.
- Sécurité: chiffrement en transit (TLS) et au repos (AES), 2FA, gestion des secrets, logs d’audit, durcissement CORS/Rate limiting.
- Conformité: PIPEDA, rétention contrôlée, localisation des données au Canada si possible.
- Intégrations: Stripe (paiements/jalons), géolocalisation (recherche), e‑signature, vérifs légales (RBQ/assurances/permis).
- CI/CD: pipelines de build/test/scan, déploiement progressif, migrations.

## Parcours principaux
- Création de projet: brief + budget + échéancier + pièces jointes → publication → shortlist manuelle.
- Recherche pros: filtres/tri → profils → ajout à shortlist → demande de devis.
- Contrat standard: sélection modèle (travaux/province) → clauses éditables → e‑signature → journal d’activité.
- Paiements par jalons: définition jalons → dépôt (escrow) via Stripe → libération à validation.
- Évaluation post‑projet: grille multi‑critères → avis publié → impact réputation.
- Médiation: ouverture litige → collecte preuves → décision → blocage/déblocage jalon.

## Notes UX
- Inspiré par les principes de clarté et hiérarchie d’Apple.com: visuels épurés, micro‑interactions, focus sur conversion et confiance.

## Prochaines étapes MVP
- Québec: profils pros + recherche/filtres + création de projet + contrats standards + paiements par jalons + évaluations + multilingue FR/EN + sécurité (2FA, audit) + conformité de base.
- Itérations: enrichir IA de matching, étendre vérifs provinciales, dashboards analytiques, offre VIP.

