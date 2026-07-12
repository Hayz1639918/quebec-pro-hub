# Templates de courriels Supabase Auth — BâtirNet

## Problème corrigé

Le logo BâtirNet (`public/logo-batirnet.png`) est **bleu (#0066CC) sur fond
transparent**. Posé directement sur l'en-tête bleu du courriel, il était
invisible (bleu sur bleu — voir capture du 2026-07-03).

**Correctif appliqué :** le logo est désormais placé sur une **pastille blanche
arrondie** dans l'en-tête. Le logo lui-même et le reste du design (en-tête bleu,
textes, bouton) sont inchangés.

## Comment appliquer (manuel — dashboard Supabase)

Ces templates ne se déploient pas par migration : ils doivent être collés dans
le dashboard.

1. Ouvrir le [dashboard Supabase](https://supabase.com/dashboard) → projet
   BâtirNet (`eieywrvrhdwbhefmlxoe`).
2. Aller dans **Authentication → Emails → Templates**.
3. Pour chaque template ci-dessous, coller le contenu du fichier HTML dans le
   corps (« Message body ») et définir le sujet :

| Template Supabase | Fichier | Sujet |
|---|---|---|
| Confirm signup | `confirm-signup.html` | `Confirmez votre compte BâtirNet` |
| Reset password | `reset-password.html` | `Réinitialisez votre mot de passe BâtirNet` |

4. Vérifier que **Authentication → URL Configuration → Site URL** pointe vers
   l'URL de production (le logo est chargé via `{{ .SiteURL }}/logo-batirnet.png`,
   servi depuis `public/`).
5. Envoyer un courriel de test (créer un compte jetable) et vérifier que le
   logo est bien visible sur la pastille blanche.

## Notes techniques

- HTML en tables + styles inline : compatibilité maximale avec les clients
  courriel (Gmail, Outlook, Apple Mail).
- Largeur max 600 px, lisible sur mobile.
- Chaque courriel inclut un lien de secours en texte brut sous le bouton.
- Ne pas remplacer `{{ .ConfirmationURL }}` / `{{ .SiteURL }}` : ce sont des
  variables injectées par Supabase à l'envoi.
