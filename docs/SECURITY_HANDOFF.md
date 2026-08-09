# 🔐 Rapport de passation sécurité — BâtirNet / quebec-pro-hub

**Destinataire** : IA (ou personne) disposant des **accès production** — Supabase
(dashboard + SQL Editor ou CLI), Vercel, Resend, GitHub admin.

**Contexte** : un audit de sécurité pré-lancement a été réalisé sans accès
production (pas de `.env`, pas de CLI/MCP Supabase). Les corrections **code** sont
dans la PR #103 (branche `claude/security-audit-prelaunch-97wh1b`). Ce document
liste **tout ce qui reste à faire et qui nécessite des accès** que l'auditeur
n'avait pas.

Référence projet Supabase : `gsnjnhxzacwjslirfxgy`

> Règle d'or : **appliquer, puis VÉRIFIER** chaque étape (une commande de
> vérification est fournie à chaque fois). Ne pas déclarer « sécurisé » sans la
> vérification correspondante.

---

## 0. Ordre d'exécution recommandé

1. §1 — Appliquer les 4 migrations SQL (090, 091, 092, 093) dans l'ordre.
2. §2 — Vérifier la configuration Storage (buckets privés).
3. §3 — Déployer / vérifier l'edge function + ses secrets.
4. §4 — Tests d'autorisation multi-comptes (IDOR) — **le point que l'audit n'a pas pu faire en live**.
5. §5 — Config Supabase Auth (site_url, OAuth, MFA, SMTP).
6. §6 — Plafonds de coûts & rate limiting (blast radius).
7. §7 — Sauvegardes testées.
8. §8 — Scanners de sécurité (CodeQL, Dependabot, npm audit).
9. §9 — Dépendances résiduelles.
10. §10 — Checklist d'acceptation finale.

---

## 1. Migrations SQL à appliquer (⚠️ BLOQUANT)

Quatre migrations sont écrites mais **non appliquées** en prod. Appliquer via
**SQL Editor** (copier/coller le contenu) ou **CLI** :

```bash
supabase link --project-ref gsnjnhxzacwjslirfxgy
supabase db push        # applique toutes les migrations non appliquées
```

### 1.1 — `090_restrict_authenticated_profile_reads.sql`
- **But** : un compte authentifié ne peut lire un profil CLIENT que s'il a une
  relation d'affaires réelle (fonction `has_business_relationship`). Ferme le
  risque résiduel documenté en 088.
- **Vérifier** : avec un compte pro A sans lien avec le client C,
  `SELECT email FROM profiles WHERE id = '<C>'` doit renvoyer 0 ligne (via
  l'API REST authentifiée en tant que A).

### 1.2 — `091_enforce_mfa_aal2.sql`
- **But** : politiques RESTRICTIVE exigeant `aal2` (MFA satisfaite) sur 11 tables
  sensibles — empêche de contourner le défi 2FA via l'API.
- **Vérifier** : un utilisateur ayant activé la MFA mais authentifié seulement
  en `aal1` (sans avoir passé le défi TOTP) ne doit PAS pouvoir lire/écrire ces
  tables. Voir la fonction `mfa_satisfied()`.

### 1.3 — `092_secure_sensitive_storage_buckets.sql` (🔴 CRITIQUE)
- **But** : rend `certifications` et `chat-attachments` **privés** + politiques
  RLS (propriétaire/admin pour les documents, participants pour le chat).
- **Contexte du risque** : le bucket `certifications` était public et contient
  des **pièces d'identité** (passeport, permis, RAMQ), assurances, licences RBQ.
  Tant que ceci n'est pas appliqué, ces documents restent lisibles publiquement.
- **Vérifier** (voir §2).

### 1.4 — `093_enable_rls_message_rate_limits.sql`
- **But** : active la RLS sur `message_rate_limits` (fuite de métadonnées
  d'activité entre utilisateurs).
- **Vérifier** :
  ```sql
  SELECT relrowsecurity FROM pg_class WHERE relname = 'message_rate_limits';
  -- doit renvoyer true
  ```

### Vérification globale RLS (après application)
```sql
-- Aucune table publique ne doit avoir RLS désactivée :
SELECT tablename FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' AND NOT c.relrowsecurity;
-- Résultat attendu : 0 ligne.
```

---

## 2. Vérification Storage (buckets privés)

Après migration 092, contrôler dans **Dashboard → Storage** ou en SQL :

```sql
SELECT id, public FROM storage.buckets ORDER BY id;
```

| Bucket | Attendu |
|---|---|
| `certifications` | **private** (`public = false`) |
| `chat-attachments` | **private** |
| `contracts` | private (déjà) |
| `insurance-certificates` | private (déjà) |
| `avatars`, `portfolio`, `portfolio-images`, `projects`, `project-media` | public (voulu — contenu affiché publiquement) |

**Test manuel indispensable** : prendre l'URL publique d'une ancienne pièce
d'identité (format `https://<ref>.supabase.co/storage/v1/object/public/certifications/<user>/identity-...`)
et l'ouvrir **en navigation privée / déconnecté**. Après 092, elle doit renvoyer
**400/403** (et non plus le fichier). Vérifier ensuite que :
- un **admin** connecté peut toujours ouvrir le document (via URL signée dans AdminDashboard) ;
- un **utilisateur** peut toujours voir ses propres pièces jointes de chat.

**Vérifier aussi** qu'aucune politique publique résiduelle ne subsiste :
```sql
SELECT policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND qual ILIKE '%certifications%' OR qual ILIKE '%chat-attachments%';
-- Ne doit lister que les politiques propriétaire/admin/participants (pas de "Anyone can view").
```

---

## 3. Edge function `send-signature-confirmation`

Le code a été durci dans la PR (échappement HTML, validation, CORS restreint).
Reste à faire côté déploiement :

1. **Redéployer** la fonction (elle a changé) :
   ```bash
   supabase functions deploy send-signature-confirmation
   ```
   (Le `config.toml` fixe `verify_jwt = true` — ne pas déployer avec `--no-verify-jwt`.)
2. **Secrets requis** (Dashboard → Edge Functions → Secrets, ou CLI) :
   ```bash
   supabase secrets set RESEND_API_KEY=<clé_resend>
   supabase secrets set SIGNATURE_EMAIL_FROM=noreply@batirnet.com
   ```
3. **Vérifier** :
   - appel **sans JWT** → 401 (rejeté par la plateforme) ;
   - appel authentifié avec `recipientEmail` invalide → 400 ;
   - le domaine dans `ALLOWED_ORIGINS` (index.ts) correspond bien au domaine de prod ; sinon l'ajuster.

---

## 4. Tests d'autorisation multi-comptes (IDOR) — À FAIRE EN LIVE

L'audit statique confirme que les RPC et la RLS sont correctes, **mais la
validation dynamique n'a pas pu être faite**. Créer au moins 3 comptes de test
(Client A, Client B, Pro P, + 1 Admin) et vérifier, via l'API REST authentifiée
(pas seulement l'UI) :

| Scénario | Attendu |
|---|---|
| Client A lit `profiles`/`projects`/`contracts` de Client B | refusé / 0 ligne |
| Client A appelle `approve_milestone` sur un contrat de B | `Not authorized` |
| Pro P lit les `messages`/`conversations` d'une autre paire | 0 ligne |
| Utilisateur normal appelle `admin_verify_rbq` / `admin_delete_rejected_account` | `Unauthorized: Admin access required` |
| Requête **anonyme** sur `contracts`, `payments`, `notifications`, `disputes` | 0 ligne |
| Anonyme sur `profiles?user_type=eq.client` (emails) | 0 ligne (grâce à 088/090) |
| Modifier un `id` dans une requête pour cibler la ressource d'autrui | refusé par RLS |

**Méthode** : récupérer le JWT d'un compte (DevTools → localStorage
`sb-<ref>-auth-token`) et faire des `curl` directs vers
`https://<ref>.supabase.co/rest/v1/...` avec `Authorization: Bearer <jwt>` et
`apikey: <anon>`. Documenter chaque résultat.

---

## 5. Configuration Supabase Auth (Dashboard)

À vérifier / corriger (Dashboard → Authentication) :

- **`site_url`** = `https://batirnet.com` (et non `localhost`). Les liens de
  confirmation/réinitialisation en dépendent.
- **`uri_allow_list`** contient `https://batirnet.com/**` et
  `https://www.batirnet.com/**`.
- **SMTP** : Resend branché (`smtp_admin_email = noreply@batirnet.com`), domaine
  vérifié dans Resend, `rate_limit_email_sent` raisonnable (~30/h).
- **OAuth Google/Apple** : si les boutons sont exposés dans l'UI (US-002), activer
  et configurer les fournisseurs, sinon les masquer.
- **MFA** : TOTP activé ; cohérent avec la migration 091.
- **Politique de mot de passe** : longueur min ≥ 8, complexité (déjà appliquée
  côté client, confirmer côté serveur).
- **Protection anti-fuite** : activer « Leaked password protection » (HaveIBeenPwned)
  si disponible.

---

## 6. Plafonds de coûts & rate limiting (« cap the blast radius »)

Aucun plafond n'a pu être configuré (pas d'accès). À mettre en place :

- **Supabase** : alertes d'usage / plan avec limites ; surveiller le nombre de
  requêtes et le stockage.
- **Resend** : quota d'envoi + alerte (un bug d'envoi d'email ne doit pas exploser
  la facture ni faire blacklister le domaine).
- **Vercel** : limites de build / bande passante + alertes de facturation.
- **Rate limiting applicatif déjà présent** : messagerie 20 msg/min
  (`check_message_rate_limit`). Envisager d'étendre à d'autres endpoints coûteux
  si ajoutés plus tard.
- **Auth** : limites côté Supabase (login/signup/reset) — vérifier qu'elles sont
  actives et raisonnables.

---

## 7. Sauvegardes (GitHub n'est PAS une sauvegarde)

- Activer les **backups automatiques** Supabase (PITR si le plan le permet).
- Définir : fréquence, rétention, RPO/RTO.
- **Tester une restauration** sur un projet/staging — une sauvegarde non testée
  n'est pas une sauvegarde.
- Sauvegarder aussi la config (variables d'env, secrets edge functions, templates
  email) hors du repo.

---

## 8. Scanners de sécurité

- **CodeQL** : déjà présent (`.github/codeql`, workflow). Vérifier qu'il tourne
  vert sur `main` et traiter les alertes du Security tab.
- **Dependabot** : `.github/dependabot.yml` présent. **53 alertes sur `main`**
  (17 high, 34 moderate, 2 low) au moment de l'audit — en grande partie des
  transitives de tooling ; la branche PR corrige déjà une partie via
  `npm audit fix`. Traiter/merger les PRs Dependabot.
- **npm audit** : après merge, viser 0 high runtime. Restant connu : esbuild/vite
  (dev-only, cf §9).
- Optionnel selon le stack : **Semgrep** (règles OWASP) et **Snyk**. Ne pas
  installer d'outil inutile — le stack est React/Vite + Supabase (pas de
  conteneur → Trivy N/A).

---

## 9. Dépendances résiduelles

- `npm audit` après la PR : **4 vulnérabilités** restantes.
  - **esbuild/vite** (modéré, **dev-only**) : le correctif exige `vite@8`
    (breaking). À traiter dans une montée de version dédiée + tests, hors du
    chemin critique de sécurité prod (le serveur de dev n'est pas exposé).
- `react-router-dom` a été monté à `6.30.4` (open-redirect corrigé dans la 6.x).

---

## 10. Points connus (non bloquants, à décider)

- **Stockage du token en `localStorage`** (défaut Supabase). Atténué par CSP +
  DOMPurify. Migration vers cookies HttpOnly = chantier optionnel (nécessite un
  backend de session ; non trivial avec Supabase JS côté navigateur).
- **`tsconfig.json` — erreur TS5101** (`baseUrl` déprécié) fait échouer
  `npm run type-check` avec TypeScript 5.9+. Correctif simple :
  ajouter `"ignoreDeprecations": "6.0"` dans `compilerOptions`. (Non lié à la
  sécurité ; débloque le gate de type-check.)
- **Chunk `vendor-pdf` 1,49 MB** : perf, non sécurité (lazy-loaded).

---

## 11. Checklist d'acceptation finale

Cocher quand vérifié **en prod** :

- [ ] Migrations 090, 091, 092, 093 appliquées (`supabase db push` ok).
- [ ] `SELECT relrowsecurity ...` : toutes les tables publiques ont RLS = true.
- [ ] Buckets `certifications` + `chat-attachments` = private ; ancienne URL
      publique d'ID document renvoie 403 en anonyme.
- [ ] Admin peut ouvrir un document (URL signée) ; chat affiche les pièces jointes.
- [ ] Edge function redéployée, secrets posés, appel sans JWT rejeté.
- [ ] Tests IDOR §4 : tous « refusé » documentés.
- [ ] `site_url` / `uri_allow_list` = domaine de prod ; emails de confirmation OK.
- [ ] Plafonds/alertes de facturation configurés (Supabase, Resend, Vercel).
- [ ] Backups activés + **restauration testée**.
- [ ] CodeQL vert ; alertes Dependabot traitées ; `npm audit` 0 high runtime.
- [ ] Build + tests + lint verts sur la branche mergée.

> Ne jamais déclarer « 100 % sécurisé ». Déclarer : « sécurisé selon les
> vérifications ci-dessus », en listant les risques résiduels restants.
