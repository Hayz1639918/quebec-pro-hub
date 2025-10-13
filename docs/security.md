# Sécurité & Conformité — BâtirNet

## Sécurité
- Authentification: email+mot de passe, SSO (futur), 2FA obligatoire pour rôles sensibles.
- Chiffrement: TLS en transit, AES au repos (DB et objets sensibles).
- Secrets: gestion centralisée (vault), rotation, accès restreint.
- Durcissement API: CORS strict, rate limiting, validation schémas, protection anti‑CSRF/XXE.
- Journalisation: logs structurés, corrélation par requête, traçage distribué.
- Audit: logs d’audit inviolables pour opérations clés (contrats, paiements, litiges).

## Conformité
- PIPEDA: minimisation des données, finalité déterminée, consentement, droit d’accès et rectification.
- Rétention: politiques par type de données, purge automatisée.
- Localisation: hébergement et sauvegardes prioritairement au Canada quand possible.
- Légal provincial: vérifs RBQ/assurances/permis, archivage des preuves, alertes d’expiration.

