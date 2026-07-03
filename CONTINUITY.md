# CONTINUITY.md — BâtirNet Audit & Production-Readiness

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
- Les types générés Supabase (`src/integrations/supabase/types.ts`) sont obsolètes → TODO : `supabase gen types` quand accès CLI dispo, puis supprimer `untyped.ts`.

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

## 20. Security / production-readiness risks
- 🔴 **CRITIQUE — Fuite de PII confirmée sur la base de PROD (2026-07-03, testé avec la clé publishable anonyme réelle)** :
  - Table `profiles` lisible intégralement par le rôle `anon` : **7 profils CLIENTS avec emails et 3 téléphones** exposés à tout visiteur non authentifié via l'API REST (`/rest/v1/profiles?user_type=eq.client`). Viole Loi 25 / GDPR (US-120/121).
  - Table `projects` : **9 projets `in_progress`** visibles publiquement (devraient être privés ; seuls les `open` relèvent de la place de marché).
  - Bonnes nouvelles : toutes les autres tables sensibles (contracts, messages, conversations, contractor_payments, disputes, notifications, reviews, user_reports, proposals) renvoient **0 ligne** à l'anon → RLS correct.
  - Correctif écrit : `supabase/migrations/088_protect_client_pii.sql` (anon → profils `professional` uniquement + projets `open` uniquement ; authenticated conserve l'accès). **NON APPLIQUÉ** — à exécuter par l'utilisateur (SQL Editor Supabase / `supabase db push`) car touche les politiques RLS de prod sans staging. Procédure de vérification incluse dans le fichier.
  - Note : je n'ai pas les privilèges (clé anon seulement) pour appliquer ou pousser la migration.
- ~~Vulnérabilités npm~~ : corrigées sauf esbuild/vite (dev-only, accepté). Les 40 alertes Dependabot GitHub datent de main — la branche est en avance.
- Chunk PDF 1.49 MB (perf).
- Couverture de tests quasi nulle (3 fichiers).
- OAuth Google/Apple (US-002) absent ; Stripe stub (paiement en ligne indisponible, hors-plateforme OK) ; i18n incomplet sur certaines pages (textes français en dur, ex. ProposalsList, ProposalView) alors que le site se dit FR/EN.

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
