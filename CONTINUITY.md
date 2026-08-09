# CONTINUITY.md — BâtirNet Audit & Production-Readiness

## ⚡ Session 2026-08-09 — Audit sécurité pré-lancement — branche `claude/security-audit-prelaunch-97wh1b`

**Demande** : audit de sécurité complet (checklist pré-lancement) + connexion
Supabase (MCP/CLI) pour vérifier/corriger la sécurité.

**Connexion Supabase** : ❌ impossible dans cette session — aucune variable
d'env (`.env`/`.env.local` absents), pas de CLI Supabase installé, pas de MCP
Supabase disponible. L'audit DB a été fait **statiquement** sur les 92 migrations
(qui définissent entièrement la posture RLS). Les migrations ne peuvent pas être
appliquées par moi → action propriétaire requise (voir ci-dessous).

**🔴 CRITIQUE trouvé & corrigé (code + migration) — fuite de documents privés** :
- Bucket `certifications` était **public** (migration 041 l'avait basculé de privé
  → public). Il contient licences RBQ, **certificats d'assurance** ET **pièces
  d'identité gouvernementales** (passeport, permis, carte RAMQ — via
  `id_document_url`, migration 069). Tout fichier était lisible par n'importe qui
  via `getPublicUrl` (chemins `<user_id>/identity-<timestamp>` semi-devinables).
  Violation Loi 25 / RGPD.
- Bucket `chat-attachments` était **public** → fichiers de conversations privées
  lisibles par tous.
- **Correctif** : migration `092_secure_sensitive_storage_buckets.sql` (buckets →
  privés + politiques RLS : propriétaire/admin pour certifications, participants
  pour chat). Code basculé sur URLs signées : `src/lib/storage.ts` (helper),
  `AdminDashboard` (ouverture doc via URL signée), `ProfessionalProfile` (retrait
  de l'exposition publique des documents RBQ/assurance), `ChatWindow` +
  `ChatAttachment.tsx` (URLs signées, stocke désormais le chemin). ⚠️ **Migration
  092 à APPLIQUER en prod** (SQL Editor / CLI).

**🟠 HIGH corrigés (code)** :
- Aucun en-tête de sécurité sur le déploiement Vercel → ajoutés dans `vercel.json`
  (CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy). CSP calibrée pour Google Fonts, tuiles Leaflet, Supabase
  REST/Realtime, Resend.
- Edge function `send-signature-confirmation` : valeurs utilisateur interpolées
  dans le HTML sans échappement (injection/phishing) + CORS `*`. Durcie :
  validation d'entrées (email/longueurs), échappement HTML, URL de vérification
  restreinte au domaine, CORS restreint, JWT explicite dans `config.toml`.
- `scripts/seed-test-projects.js` : URL Supabase + clé anon en dur → variables
  d'environnement.

**🟡 MEDIUM/LOW** : `npm audit fix` (non-breaking) appliqué → 10 → 4 vulns
(3 modérées + 1 dev-only) ; react-router-dom 6.30.1 → 6.30.4 (open-redirect),
postcss patché. Restant : esbuild/vite (dev-only, nécessite vite@8 majeur —
reporté). Stockage token en localStorage = défaut Supabase (mitigé par CSP +
DOMPurify). Rate limiting applicatif côté client seulement (auth Supabase a des
limites serveur).

**✅ BON / déjà en place** : buckets `contracts` et `insurance-certificates`
privés ; XSS maîtrisé (DOMPurify sur tous les `dangerouslySetInnerHTML`) ; RLS
activée sur les tables sensibles ; `is_admin()` SECURITY DEFINER avec
`search_path` fixé ; secrets hors du repo (aucune service-role key committée) ;
`.gitignore` couvre les `.env`.

**Validations** : `npm install` ✅, `build` ✅, `lint` 0 erreur / 65 warnings
(baseline), `test` 18/18 ✅. type-check : erreur pré-existante TS5101
(`baseUrl` déprécié dans tsconfig.json, non liée à ce travail).

**RESTE À FAIRE (propriétaire)** :
1. Appliquer migration **092** (buckets privés) — CRITIQUE.
2. Appliquer migrations **090** (profils→authenticated) et **091** (MFA aal2)
   écrites dans une session précédente, toujours en attente.
3. Après 092 : vérifier dans le dashboard Storage que `certifications` et
   `chat-attachments` sont bien `Private` et qu'aucune politique publique
   résiduelle ne subsiste.
4. Configurer alertes/plafonds de facturation (Supabase, Resend) — « cap the
   blast radius ».
5. Mettre en place des sauvegardes DB testées (restauration) — GitHub n'est pas
   une sauvegarde.

---

## ⚡ Session 2026-07-12 — branche `claude/p2p-payment-system-qq1xqg`

**Objectif de la session** (demande utilisateur) : Stripe reporté (indicateur
« à venir » seulement) ; correction RLS ; OAuth ; 2FA ; tests E2E ; préparation
du déploiement final ; correction du courriel de confirmation (logo bleu sur
bleu invisible).

**Livré (5 commits)** :
1. **Courriels** : templates Supabase Auth recréés (`supabase/email-templates/`),
   logo (bleu sur fond transparent) posé sur pastille blanche arrondie —
   visible, design inchangé. Confirmation + réinitialisation. **À coller
   manuellement dans le dashboard** (voir README du dossier). Rendu vérifié
   par screenshot Playwright.
2. **Stripe « à venir »** : badge réutilisable `OnlinePaymentComingSoonBadge`
   sur ClientPayments (bloc paiement plateforme), ProPayments (alerte d'en-tête
   + carte compte bancaire) et ProBankAccount. Textes ajustés au futur.
3. **RLS** : migration `090_restrict_authenticated_profile_reads.sql` — ferme
   le risque résiduel documenté en 088 : les comptes authentifiés ne lisent
   les profils CLIENTS qu'avec une relation d'affaires réelle (fonction
   SECURITY DEFINER `has_business_relationship` : conversation, contrat,
   proposition, invitation, paiement, soumission, avis, projet open). Propre
   profil + profils professionnels + admins inchangés. **À appliquer en prod.**
4. **OAuth Google/Apple (US-002)** : boutons sur /auth (connexion + inscription),
   choix de type de compte transmis via localStorage à travers l'aller-retour
   OAuth puis appliqué au profil (conversion client→professionnel du profil
   vierge créé par le trigger). Config dashboard documentée dans
   docs/authentication.md. Message clair si fournisseur non activé.
5. **2FA TOTP** : composant `TwoFactorSettings` (QR + code) dans ClientProfile
   et ProProfile (onglet infos) ; défi 2FA à la connexion dans Auth.tsx
   (resolvePostAuth partagé mot de passe/OAuth) ; migration
   `091_enforce_mfa_aal2.sql` (politiques RESTRICTIVE aal2 sur 11 tables
   sensibles — l'API ne peut pas contourner le défi). **À appliquer en prod.**
6. **Tests E2E** : `playwright.config.ts` + `e2e/public-routes.spec.ts`
   (13 tests ✅ : rendu, formulaires auth, OAuth, responsive 320→1440 sans
   overflow, 404). `npm run test:e2e`. Chromium pré-installé réutilisé,
   env Supabase factice, e2e/ exclu de Vitest.
7. **Déploiement** : `docs/deployment-checklist.md` — validations, migrations
   090/091 à appliquer, config dashboard (courriels, OAuth, MFA, URLs),
   vérifications post-déploiement. Le déploiement production reste à
   déclencher par le propriétaire.

**Validations session** : type-check ✅, 18/18 tests unitaires ✅, 13/13 E2E ✅,
lint 0 erreur / 65 warnings (baseline 66), build ✅.

**Reste à faire (manuel, propriétaire)** : appliquer 090+091, coller les
2 templates courriel, configurer Google/Apple OAuth, valider la checklist
de déploiement (docs/deployment-checklist.md) puis déployer.

---

## 1. Final objective
Auditer et améliorer BâtirNet (marketplace construction Québec : clients ↔ entrepreneurs ↔ admin) pour la rendre production-ready selon des validations vérifiables : fonctionnel, responsive (320px→1440px+), accessible (base WCAG), UX cohérente, alignée sur les 123 user stories (US-001 → US-123), code maintenable, faible duplication.

## 2. Current project state
- Branche : `claude/claude-md-working-rules-tayepf` (à jour avec origin).
- Stack : React 18 + TypeScript + Vite, Tailwind + shadcn/ui (49 composants ui), TanStack Query, react-router-dom v6, Supabase (auth/DB/storage/realtime, 89 migrations), i18next (fr/en — PAS d'arabe/RTL), react-leaflet, @react-pdf/renderer, petit serveur Express (`server/`), déployé Vercel (rewrites + cache headers dans vercel.json).
- Baseline validations (2026-07-03) :
  - `npm run type-check` ✅ PASS
  - `npm run build` ✅ PASS (warning : chunk vendor-pdf 1.49 MB)
  - `npm test` ✅ 18/18 tests passent (3 fichiers seulement — couverture très faible)
  - `npm run lint` ⚠️ 182 problèmes : 116 errors (111 × no-explicit-any, 3 no-empty, 1 prefer-const, 1 no-unused-expressions) + 66 warnings (surtout react-hooks/exhaustive-deps)
- GitHub Dependabot : 40 vulnérabilités sur main (1 critique, 17 high) — à auditer via `npm run audit:security`.

## 3. What has been analyzed
- Structure projet, package.json/scripts, vercel.json, README, docs/ (19 fichiers incl. user-stories-client-audit.md), pages (42), composants (par domaine : admin, contracts, dashboard, disputes, forms, invitations, map, messaging, payments, pdf, pro, reviews), migrations Supabase, i18n locales.
- Git log : travail récent déjà fait sur US-006→045 (client) et US-106→117 (pro métier), fixes auth-lock et stale chunks.

## 4. What has been modified
- **Batch 1 (terminé)** : 116 erreurs lint → 0. Détail :
  - 22 × `catch (x: any)` → `catch (x: unknown)` (sed global).
  - Créé `src/types/tender.ts` : interfaces domaine (ProposalRecord, TenderProject, PartyInfo, TeamMember, TimelinePhase, ProposalReference, ProjectMilestone, InsuranceRequirements…) utilisées par ProposalView, TenderView, ProposalPDF, TenderPDF.
  - Créé `src/integrations/supabase/untyped.ts` : export `db` (SupabaseClient non générique) remplaçant 14 × `(supabase as any)` — nécessaire car les types générés sont obsolètes (4 tables sur ~30).
  - Casts ciblés `as any` → types structurels précis (profiles/contracts joins) dans ProjectDetails, ProjectProgress, ProjectReport, ProfessionalProfile, CompleteProfileEntrepreneur, ChatWindow, UploadContract, AdminDashboard, InviteProfessionalDialog.
  - `Proposal` exporté de ProposalsList et réutilisé dans Dashboard (dé-duplication de type).
  - `: any` redondants retirés des callbacks sur résultats Supabase déjà non typés (Dashboard, ProCalendar, ProDashboard, ProMyProjects, ProReviews, ProfessionalProfile, ProjectProgress, ProjectReport) — comportement identique ; vrai typage attendra la régénération des types Supabase.
  - 3 `catch {}` vides commentés (Contracts.tsx), 1 prefer-const, 1 ternaire-expression → if/else (ChatWindow).

## 5. Important decisions made
- Ordre du plan d'audit : (1) lint errors bloquants, (2) sécurité deps, (3) flows critiques par rôle, (4) responsive, (5) accessibilité, (6) duplication/gros fichiers.
- Réponses utilisateur (2026-07-03) : US-118 arabe/RTL **reporté** ; crypto (US-034) **hors scope** ; Supabase prod existe mais **pas de staging** → validations via code/build/tests, pas de tests destructifs sur la base réelle.
- ✅ **RÉSOLU (2026-07-03)** : types Supabase régénérés via l'API de gestion (access token utilisateur, `api.supabase.com` — domaine différent de la base `*.supabase.co`, a nécessité l'ouverture d'un 2e domaine dans la politique réseau). 737 → 7701 lignes, 4 → toutes les tables du schéma réel (admin_audit_logs, project_invitations, review_reports, user_reports, etc.). `src/integrations/supabase/untyped.ts` (client `db` non typé, 14 casts contournés au Batch 1) **supprimé** ; les 5 fichiers qui l'utilisaient (ChatWindow, InviteProfessionalDialog, ProfessionalProfile, AdminDashboard, ProDashboard) basculés sur le client `supabase` typé normal. `src/types/tender.ts` conservé : complémentaire (typage métier au-dessus des colonnes JSON brutes), pas de doublon avec le schéma généré. Le token d'accès n'a pas été stocké dans le repo (utilisé en variable d'environnement shell éphémère puis effacé).

## 6. Constraints to respect
- Pas de changements destructifs sans confirmation. Petits lots + validation après chaque lot. Push uniquement sur `claude/claude-md-working-rules-tayepf`.
- MVP web only ; mobile natif + blockchain hors scope ; arabe/RTL (US-118) : présent dans les US mais non implémenté — à confirmer avec l'utilisateur.

## 7. Open questions
- US-118 (arabe + RTL) : requis pour ce MVP ou reportable ?
- Paiement crypto (US-034) : hors scope MVP ? (supposé oui)
- Y a-t-il un environnement Supabase de staging accessible pour tests manuels ? (supposé non — vérifications via code + build + tests)

## 8. Errors or problems encountered
- Aucune erreur d'exécution. Lint : 116 errors.

## 9. Files created or modified
- Créé : CONTINUITY.md.

## 10. Commands executed and results
- Baseline : `npm install` OK ; `type-check` OK ; `build` OK (warn chunk PDF 1.49MB) ; `test` 18/18 OK ; `lint` 116 errors/66 warnings.
- Après Batch 1 : `lint` 0 errors / 66 warnings ; `type-check` OK ; `test` 18/18 OK ; `build` OK.
- Connexion Supabase PROD établie via .env.local (clé publishable) après ouverture de la politique réseau de l'environnement. Audit REST anon : profiles/projects fuient (voir §20). Navigateur de test NE peut PAS atteindre Supabase (ERR_CONNECTION_RESET via proxy : cert MITM non fiable) → audit visuel des pages privées peuplées toujours impossible ici ; curl fonctionne.
- Batch 2 : `npm audit` 6 vulns → `npm audit fix` → 2 restantes (esbuild/vite dev-only). Re-validation complète OK (tsc, 18/18 tests, build, lint 0 err).

## 11. Tests/build/lint/typecheck performed
Voir §2 baseline.

## 12–13. Responsive checks performed / remaining issues
- **Batch 4 (2026-07-03)** : build avec env Supabase stub + `vite preview` + Playwright (Chromium /opt/pw-browsers).
  - Routes testées : /, /auth, /auth?mode=login, /privacy-policy, /professionals, /projects, 404 — largeurs 320/390/768/1024/1440/1920.
  - **Aucun overflow horizontal détecté** (mesure scrollWidth vs clientWidth + détection des éléments fautifs).
  - Screenshots vérifiés visuellement à 390px : accueil, auth, professionals, projects, 404 — layouts corrects, nav mobile hamburger OK, formulaires lisibles, états de chargement visibles.
  - ⚠️ L'overlay IntroExperience (`bn_intro_done_v1`) s'affiche au 1er chargement — normal, mais penser au flag pour les tests E2E.
  - Limite : pages privées (dashboards, contrats, paiements) non testables en live sans .env réel — audit statique Tailwind seulement (grep responsive OK sur les composants extraits).
  - Console : seules erreurs = fetch Supabase stub (attendu) + log 404 ; aucune erreur applicative.
  - Correctif : page 404 était en anglais + `console.error` à chaque 404 → réécrite (i18n fr/en, thème du design system, vrai `<Link>` + Button, console.warn).

## 14–16. User flows / features / components reviewed
- **Batch 3 (audit code, pas de navigation live — pas de .env local)** :
  - **Auth (US-001/004/005)** : mot de passe 8+ car./majuscule/chiffre/spécial avec indicateur de force ✅ (l'audit docs/user-stories-client-audit.md de mars est OBSOLÈTE sur ce point). Reset par lien ✅. **OAuth Google/Apple (US-002) toujours absent** ❌.
  - **Guards** : /pro/* via ProtectedProRoute (metadata + fallback table profiles + timeout anti-écran-blanc) ✅ ; /admin via ProtectedAdminRoute ✅ ; pages client auto-guardées (redirect /auth vérifié sur Dashboard, NewProject, ClientPayments, Messages, Contracts, Notifications, ClientProfile, EditProject) ✅.
  - **Acceptation/refus de proposition (US-043/044)** : via RPC SQL sécurisées accept_proposal/reject_proposal, toast + redirect ✅.
  - **Paiements (US-034/035/061)** : Stripe est un STUB (`stripe-service.ts` : toutes les fonctions jettent « not configured ») — l'UI le gère proprement (toast « Stripe bientôt disponible », `isStripeConfigured()`), et le règlement HORS PLATEFORME est le flux fonctionnel (marquer facture payée côté pro). Paiement en ligne = limitation documentée en attente des clés Stripe.
  - **Signature (US-032/062)** : ESignature dessin/saisie + signatureService + page /contracts/verify/:code ✅ (code lu, pas testé en live).
  - Pages géantes restantes à auditer : Dashboard (1706 l.), AdminDashboard (1662), ProjectDetails (1481), NewProject (1233), ProDashboard (1133), Professionals (1081), ProposeContract (1033).

## 17. Unnecessary repetitions detected
- **Batch 3bis (découpage + i18n)** :
  - Dashboard.tsx 1706 → 1516 lignes : onglets Contrats et Factures extraits en `ClientContractsTab.tsx` et `ClientInvoicesTab.tsx` (composants i18n-isés FR/EN, types ClientContract/MilestoneTransaction exportés).
  - AdminDashboard.tsx 1662 → 1376 lignes : onglets Litiges, Modération, Journal extraits en `AdminDisputesTab.tsx`, `AdminModerationTab.tsx`, `AdminAuditLogsTab.tsx` (FR seul — l'admin est interne, i18n non prioritaire).
  - ProposalsList.tsx entièrement i18n-isé (~30 chaînes FR en dur → clés `dashboard.proposals_list.*` dans fr.json + en.json).
- Restant : 91 fichiers sans useTranslation (dont ClientPayments, ProPayments, ProposalView, TenderView, pages Pro) — chantier i18n complet à planifier ; pages encore > 1000 lignes : Dashboard (1516), ProjectDetails (1481), AdminDashboard (1376), NewProject (1233), ProDashboard (1133), Professionals (1081), ProposeContract (1033).

## 18. UX/UI improvements
- À venir.

## 19. Accessibility checks performed
- **Batch 5 (2026-07-03)** : axe-core via Playwright sur 7 routes publiques (/, /auth, /auth?mode=login, /professionals, /projects, /privacy-policy, 404) → **0 violation** après correctifs.
- Corrigé : bouton œil mot de passe (aria-label + focusable, était tabIndex=-1) ; 10 SelectTrigger de filtres sans nom accessible (aria-label depuis le label visible) ; Slider (ui/slider.tsx transmet désormais aria-label au Thumb, + label sur le rayon de recherche de la carte) ; landmarks <main> sur Index/Auth/Professionals/Projects/PrivacyPolicy/NotFound ; heading h1 sur Auth (role=heading aria-level=1) ; h2 sr-only sur PrivacyPolicy (heading-order) ; ~15 classes de contraste insuffisant relevées (text-white/45–65 → /70–80, text-foreground/20–55 → /50–70) dans Footer, Hero, CTA, Features, HowItWorks — design vérifié visuellement intact.
- Navigation clavier testée sur /auth : ordre de tabulation logique, tous les contrôles atteignables.
- **Batch 5bis : pages privées auditées en live via Supabase mocké** (session factice injectée en localStorage `sb-stub-auth-token` + interception réseau Playwright renvoyant profils canned / listes vides). 10 routes × 2 rôles (client + pro) : /dashboard (+tabs), /dashboard/payments, /messages, /contracts, /dashboard/new-project, /pro/dashboard, /pro/payments, /pro/my-projects, /pro/subscription.
  - Résultat final : **0 violation axe critique/sérieuse, 0 overflow (320/390/768/1280), 0 erreur JS** sur les 10 routes.
  - Corrigé : bouton menu compte Navigation (aria-label) ; liens nav text-foreground/50→/70 ; `--muted-foreground` clair 45%→38% et sombre 55%→65% ; `.tech-label` opacité 0.5→0.7 ; `--success` 36%→30% (libellés paiements) ; text-orange-600→700 (PendingVerification) ; 4 sliders NewProject + slider budget (aria-label) ; 4 selects NewProject + 2 selects Contracts (aria-label).
  - Guards vérifiés en conditions réelles : pro non vérifié → redirection /pending-verification ✅.
  - Limite restante : audit lecteur d'écran humain recommandé pour viser WCAG 2.1 AA complet (axe ne couvre ~30-40% des critères).

## 19bis. Bug auth « blocage après plusieurs tentatives » (2026-07-03)
- **Symptôme utilisateur** : après quelques essais (mauvais mdp au login, ou email existant/invalide au signup), l'appareil est « bloqué » même en navigation privée / autre appareil.
- **Diagnostic (testé sur l'API auth réelle)** :
  - Login mauvais mdp : 12 tentatives → toujours 400 `invalid_credentials`, JAMAIS de blocage. Ce n'était pas la source.
  - Signup : dès la 3e tentative → **HTTP 429 `over_email_send_rate_limit`**. CAUSE RACINE = config Supabase `rate_limit_email_sent = 2` (2 emails/h/IP). Blocage côté serveur par IP → d'où la persistance en navigation privée / autre appareil.
  - Pas de SMTP custom (`smtp_host = None`) + `mailer_autoconfirm = false` → chaque signup envoie un email de confirmation via le SMTP de dev partagé, plafonné.
- **Correctif CODE appliqué (Auth.tsx)** : `isValidEmail()` valide le format AVANT tout appel Supabase (une faute de frappe ne consomme plus le quota) sur login/signup/forgot-password ; `mapAuthError()` traduit les erreurs brutes (429/invalid_credentials/email_exists/email_invalid/email_not_confirmed) en messages FR/EN clairs adaptés aux personnes âgées. Clés i18n ajoutées.
- **Config SERVEUR (mise à jour 2026-07-03)** : SMTP Resend configuré côté Supabase (smtp.resend.com:465, user `resend`, sender `onboarding@resend.dev`, name BatirNet) → la limite `rate_limit_email_sent` a été relevée de **2 à 30/h** (impossible sans SMTP, maintenant débloqué). Vérifié : envoi vers l'adresse propriétaire du compte Resend (hayz1639918@gmail.com) fonctionne sans erreur.
- ⚠️ **RESTE À FAIRE — vérifier un domaine dans Resend** : tant qu'aucun domaine n'est vérifié, Resend (mode test) n'envoie QU'À hayz1639918@gmail.com ; les inscriptions vers toute autre adresse échouent en 500 (SMTP 550 « verify a domain at resend.com/domains »). Étapes : (1) resend.com/domains → ajouter le domaine (ex batirnet.ca) → poser les enregistrements DNS SPF/DKIM → vérifier ; (2) mettre à jour `smtp_admin_email` vers `noreply@<domaine-vérifié>` (via API management ou dashboard Supabase). Clé API Resend et token Supabase non commités (variables shell éphémères).
- Comptes de test créés pendant le diagnostic : aucun persisté (Supabase annule la création quand l'email échoue) — base vérifiée à 33 profils, propre.
- **Mode TEST activé puis REVERT (2026-07-03)** : `mailer_autoconfirm = true` a été testé brièvement (inscription→connexion vérifiée OK sans email) puis l'utilisateur a demandé de vrais emails de confirmation vers de vraies boîtes avant l'achat d'un nom de domaine.
- **État FINAL actuel (2026-07-03)** :
  - `mailer_autoconfirm = false` (confirmation email RÉACTIVÉE).
  - SMTP Resend **retiré** (`smtp_host = None`) → retour au service email intégré de Supabase, qui livre à N'IMPORTE QUELLE vraie boîte mail sans domaine (limite ~2-4/h, largement suffisante pour les tests grâce à `isValidEmail()` qui évite de gaspiller le quota).
  - 🔴 **BLOQUANT restant** : `site_url = http://localhost:3000` et `uri_allow_list` vide. Les liens de confirmation/reset pointent vers localhost → cassés pour un utilisateur réel. **À corriger dès que l'utilisateur fournit son URL Vercel de test** : mettre `site_url` sur l'URL Vercel + ajouter `https://<url-vercel>/**` à `uri_allow_list`.
  - Plan une fois le domaine acheté : rebrancher le SMTP Resend avec le domaine vérifié (sender `noreply@<domaine>`), remonter `rate_limit_email_sent`, mettre `site_url` sur le domaine final.
- Compte de test créé pendant les essais supprimé via service_role — base à 33 profils, propre.
- **FINALISATION (2026-07-03) — domaine batirnet.com vérifié dans Resend, branché sur Vercel** :
  - SMTP Resend rebranché avec `smtp_admin_email = noreply@batirnet.com` (au lieu de `onboarding@resend.dev`). Testé : inscription vers une adresse TIERCE (example.org) → succès, `confirmation_sent_at` rempli, 0 erreur dans auth_logs (avant vérification du domaine, le même test donnait un 500 `550 verify a domain`).
  - `rate_limit_email_sent` relevé à 30/h (le domaine étant vérifié, la limite Resend par-adresse-propriétaire ne s'applique plus).
  - `site_url = https://batirnet.com` (était `localhost:3000`) ; `uri_allow_list = https://batirnet.com/**,https://www.batirnet.com/**` — les liens de confirmation/reset redirigent maintenant vers le vrai site.
  - Template d'email de confirmation personnalisé : `mailer_subjects_confirmation` = "Confirmez votre compte BâtirNet" ; `mailer_templates_confirmation_content` = HTML pro (logo `https://batirnet.com/logo-batirnet.png` dans un bandeau bleu marque #0066cc, bouton CTA, lien de secours, mention de sécurité, pied de page). Testé via un signup réel : envoi confirmé sans erreur.
  - ⚠️ Templates NON encore personnalisés (toujours le défaut Supabase, à faire si souhaité) : reset password, magic link, changement d'email, invitation. Même approche applicable (dupliquer le gabarit HTML, adapter texte/sujet).
  - Comptes de test créés pendant la vérification supprimés via service_role — base à 33 profils, propre. Aucun secret (clé Resend / token Supabase) commité, utilisés en variables shell éphémères.

## 20. Security / production-readiness risks
- 🔴 **CRITIQUE — Fuite de PII confirmée sur la base de PROD (2026-07-03, testé avec la clé publishable anonyme réelle)** :
  - Table `profiles` lisible intégralement par le rôle `anon` : **7 profils CLIENTS avec emails et 3 téléphones** exposés à tout visiteur non authentifié via l'API REST (`/rest/v1/profiles?user_type=eq.client`). Viole Loi 25 / GDPR (US-120/121).
  - Table `projects` : **9 projets `in_progress`** visibles publiquement (devraient être privés ; seuls les `open` relèvent de la place de marché).
  - Bonnes nouvelles : toutes les autres tables sensibles (contracts, messages, conversations, contractor_payments, disputes, notifications, reviews, user_reports, proposals) renvoient **0 ligne** à l'anon → RLS correct.
  - Correctif écrit : `supabase/migrations/088_protect_client_pii.sql` (anon → profils `professional` uniquement + projets `open` uniquement ; authenticated conserve l'accès). ✅ **APPLIQUÉ ET VÉRIFIÉ par l'utilisateur le 2026-07-03** via SQL Editor Supabase. Re-test anon après application : emails clients → `[]`, projets in_progress → `[]`, profils professionnels → toujours visibles, projets open → toujours visibles. Fuite colmatée, aucune régression sur l'annuaire public ni le marketplace.
  - Note : je n'ai pas les privilèges (clé anon seulement) pour appliquer ou pousser la migration.
- ~~Vulnérabilités npm~~ : corrigées sauf esbuild/vite (dev-only, accepté). Les 40 alertes Dependabot GitHub datent de main — la branche est en avance.
- Chunk PDF 1.49 MB (perf).
- Couverture de tests quasi nulle (3 fichiers).
- ~~OAuth Google/Apple (US-002) absent~~ → ✅ implémenté (2026-07-12, config dashboard requise) ; 2FA TOTP ✅ implémentée (2026-07-12, migration 091 à appliquer) ; risque résiduel profils→authenticated ✅ corrigé (migration 090 à appliquer) ; Stripe stub assumé « à venir » (indicateur affiché, hors-plateforme OK) ; i18n incomplet sur certaines pages (textes français en dur, ex. ProposalsList, ProposalView) alors que le site se dit FR/EN.

## 21. Exact next steps
1. ~~Batch 1 : lint errors~~ ✅ FAIT (116 → 0).
2. ~~Batch 2 : sécurité deps~~ ✅ FAIT — `npm audit fix` : 6 vulns → 2. Corrigées : vitest (critical, dev), form-data 4.0.6 (high, via axios), dompurify (moderate, runtime sanitisation), js-yaml (moderate). Restantes : esbuild/vite (dev server uniquement, aucun impact prod ; fix = vite 8 breaking → risque accepté, à traiter dans une mise à jour majeure dédiée).
3. ~~Batch 3 : flows critiques~~ ✅ FAIT (lecture code ; live impossible sans .env). Correctif appliqué : 27 console.log supprimés (fuite de données propositions/IDs utilisateur dans la console + bruit) dans MessagesList, ContractTemplates, ProposalsList, geolocation, CompleteProfile + 2 blocs debug vides retirés.
4. Batch 4 : responsive 5 breakpoints via Playwright screenshots.
5. ~~Batch 5 : accessibilité~~ ✅ FAIT (axe 0 violation sur les routes publiques).
6. ~~Batch 6 : dé-duplication / découpage~~ ✅ FAIT (partiel, sans risque) :
   - ProjectDetails.tsx 1481 → 1370 lignes : onglets Rapports et Fichiers extraits en `ProjectReportsTab.tsx` / `ProjectFilesTab.tsx` (components/projects/).
   - Créé `src/lib/format.ts` (formatCurrency/formatAmount/formatDateLong) : 7 implémentations dupliquées de formatCurrency et 6 de formatDate migrées (TenderView, ProposalView, ProposalPDF, TenderPDF, ProposalsList, ContractViewer, Contracts).
   - Chunk vendor-pdf 1,49 MB : VÉRIFIÉ non bloquant — chargé uniquement sur les pages PDF (lazy routes), absent du chemin critique initial (dist/index.html ne le précharge pas). Amélioration possible plus tard : import dynamique dans les handlers.
   - Pages restant > 1000 lignes (découpage futur possible, à faire avec tests) : Dashboard 1516, AdminDashboard 1376, ProjectDetails 1370, NewProject ~1240, ProDashboard 1133, Professionals 1081, ProposeContract 1033.
7. Prochain grand chantier suggéré : i18n des 91 fichiers restants, tests unitaires sur les flows critiques, régénération des types Supabase.

## 22. What must not be forgotten
- Ne jamais déclarer « 100% production-ready » ; toujours « selon les validations suivantes ».
- Mettre à jour ce fichier après chaque batch.
- docs/user-stories-client-audit.md existe déjà — le lire avant l'audit des flows client pour ne pas dupliquer le travail.

## 23. Refonte UI/UX (2026-07-03) — SaaS moderne épuré
- **Skills installés** : taste-skill (Leonxlnx) + ui-ux-pro-max (nextlevelbuilder) dans `.agents/skills/` (gitignoré, non versionné).
- **Décisions utilisateur** : direction = SaaS moderne épuré ; rollout = incrémental + validation ; images = stock Unsplash ; logo = nouveau SVG pro. Thème bleu #0066cc conservé.
- **Contrainte images** : Unsplash/picsum bloqués par le proxy de l'env (impossible de télécharger pour self-host) ; Google Fonts OK. Les images stock devront être référencées par URL (invisible dans les captures de test, OK en prod) ou l'utilisateur autorise images.unsplash.com dans son env.
- **Fait (commits sur la branche/PR #96)** :
  - Design system : typo Instrument/Source Serif → **Outfit** (géométrique) partout ; retrait des 2 serifs ; ombres ultra-diffuses teintées marine ; radius 10px ; utilitaires text-balance/pretty. `index.html`, `index.css`, `tailwind.config.ts`.
  - **Nouveau logo SVG** : `src/components/Logo.tsx` (monogramme colonnes+poutre dans tuile bleue + wordmark, variante onDark) ; `public/favicon.svg` refait. Ancien `logo-batirnet.png` conservé UNIQUEMENT pour l'email Supabase (à régénérer en PNG un jour).
  - Pages refondues : **Hero** (grille 2 col, badge, image card + trust badge, stats), **HowItWorks** (cartes bento), **Features** (section claire + panneaux image), **CTA** (carte bleue + carte claire), **Footer** (marine profond), **Auth** (logo + hérite tokens). Logos migrés dans IntroExperience + 3 CompleteProfile.
  - i18n : nouvelles clés eyebrows/titres (how_it_works.eyebrow, features.eyebrow, cta.*) FR/EN.
- **Hérité automatiquement** : toutes les pages (dashboards, tables, formulaires) reprennent la nouvelle typo/couleurs/radius/ombres via les tokens — vérifié sur le dashboard client (rendu propre sans retouche).
- **Reste à faire (si souhaité)** : polish ciblé des layouts bespoke des dashboards (client/pro/admin), pages projet/contrats/paiements ; email Supabase logo PNG ; éventuel self-host images.
- **Validations** : tsc OK, lint 0 erreur, 18/18 tests, build OK à chaque increment.
