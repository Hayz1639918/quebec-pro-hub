# Checklist de mise en production — BâtirNet

Dernière mise à jour : 2026-07-12 (branche `claude/p2p-payment-system-qq1xqg`)

## 1. Validations automatisées (état au 2026-07-12)

| Validation | Commande | Résultat |
|---|---|---|
| Typecheck | `npm run type-check` | ✅ PASS |
| Tests unitaires | `npm test` | ✅ 18/18 |
| Tests E2E (routes publiques) | `npm run test:e2e` | ✅ 13/13 |
| Lint | `npm run lint` | ✅ 0 erreur (65 warnings react-hooks, non bloquants) |
| Build | `npm run build` | ✅ PASS (warning chunk PDF ~1,5 MB, lazy-loadé, non bloquant) |
| Audit npm | `npm audit` | ⚠️ 2 vulns restantes : esbuild/vite, dev-only, risque accepté |

## 2. Base de données — migrations à appliquer manuellement

Les migrations s'appliquent dans l'ordre numérique via le SQL Editor Supabase
ou `supabase db push`. **État connu :** appliquées jusqu'à `089` + `088`
vérifiée en prod le 2026-07-03.

- [ ] `090_restrict_authenticated_profile_reads.sql` — les comptes
      authentifiés ne lisent les profils clients qu'en cas de relation
      d'affaires (Loi 25). Vérifications incluses en bas du fichier.
- [ ] `091_enforce_mfa_aal2.sql` — la 2FA ne peut pas être contournée par
      appel API direct (politiques RESTRICTIVE aal2). Sans effet pour les
      comptes sans 2FA.

## 3. Dashboard Supabase — configuration manuelle

### Courriels (logo corrigé)
- [ ] Coller `supabase/email-templates/confirm-signup.html` dans
      Authentication → Emails → Templates → *Confirm signup*
      (sujet : `Confirmez votre compte BâtirNet`).
- [ ] Coller `supabase/email-templates/reset-password.html` dans
      *Reset password* (sujet : `Réinitialisez votre mot de passe BâtirNet`).
- [ ] Envoyer un courriel de test et vérifier que le logo est visible
      (pastille blanche sur en-tête bleu).

### OAuth (US-002) — REPORTÉ (décision 2026-07-12)
Les boutons Google/Apple sont **masqués** (drapeau `VITE_ENABLE_OAUTH`,
absent = masqué). Rien à faire pour ce déploiement. Le jour venu :
configurer les fournisseurs (procédure dans `docs/authentication.md`),
puis définir `VITE_ENABLE_OAUTH=true` sur Vercel et redéployer.

### MFA / 2FA
- [ ] Vérifier que TOTP est activé : Authentication → Multi-Factor (TOTP est
      actif par défaut sur les projets Supabase récents).

### URLs
- [ ] Authentication → URL Configuration → **Site URL** = URL de production
      (sert aussi à charger le logo des courriels via `{{ .SiteURL }}`).
- [ ] Ajouter `https://<domaine>/auth` aux **Redirect URLs** (retour OAuth
      et lien de réinitialisation).

## 4. Vercel — variables d'environnement

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`

Aucun secret ne doit être exposé côté client au-delà de la clé publishable
(protégée par RLS).

## 5. Paiement en ligne (Stripe) — reporté volontairement

Le paiement en ligne est **à venir** : l'interface l'indique partout
(badge « Paiement en ligne — à venir » sur Mes paiements, Paiements pro et
Compte bancaire). Le règlement **hors plateforme** (virement/chèque/comptant
+ confirmation par l'entrepreneur) est le flux fonctionnel. À l'activation
de Stripe : fournir les clés, implémenter les fonctions de
`src/services/stripe-service.ts` (actuellement un échafaudage qui lève
« not configured ») et passer `isStripeConfigured()` à vrai — les écrans
basculeront d'eux-mêmes.

## 6. Vérifications post-déploiement (manuel, ~15 min)

- [ ] Inscription client → courriel reçu → logo visible → confirmation → dashboard.
- [ ] « Continuer avec Google » (après config) : création de compte + redirection.
- [ ] Activer la 2FA depuis Mon profil → déconnexion → reconnexion → code exigé.
- [ ] Compte client A ne voit pas le courriel du client B (REST avec JWT de A).
- [ ] /professionals et /projects publics fonctionnels (annuaire + marketplace).
- [ ] Parcours paiement hors plateforme : jalon approuvé → facture → « Marquer comme reçu ».

## 7. Risques résiduels connus

- Couverture de tests unitaires faible (18 tests) — les E2E couvrent les
  routes publiques seulement ; les parcours connectés restent à couvrir.
- 65 warnings lint react-hooks (dette, non bloquant).
- Chunk PDF 1,5 MB lazy-loadé (perf, non bloquant).
- i18n incomplet sur certaines pages (textes FR en dur).
- Le déploiement production lui-même (Vercel) doit être déclenché par le
  propriétaire du projet après validation de cette checklist.
