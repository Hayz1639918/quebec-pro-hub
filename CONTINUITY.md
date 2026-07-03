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
- Rien encore (audit en lecture seule). Fichiers créés : CONTINUITY.md (ce fichier). CLAUDE.md créé au commit précédent.

## 5. Important decisions made
- Ordre du plan d'audit : (1) lint errors bloquants, (2) flows critiques par rôle, (3) responsive, (4) accessibilité, (5) duplication/gros fichiers, (6) sécurité/deps.

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
- `npm install` OK ; `type-check` OK ; `build` OK (warn chunk PDF 1.49MB) ; `test` 18/18 OK ; `lint` 116 errors/66 warnings.

## 11. Tests/build/lint/typecheck performed
Voir §2 baseline.

## 12–13. Responsive checks performed / remaining issues
- Pas encore. Prévu : audit statique Tailwind + Playwright (Chromium préinstallé) sur 320/390/768/1024/1440.

## 14–16. User flows / features / components reviewed
- Pas encore. Pages géantes identifiées à auditer en priorité : Dashboard (1706 l.), AdminDashboard (1662), ProjectDetails (1481), NewProject (1233), ProDashboard (1133), Professionals (1081), ProposeContract (1033).

## 17. Unnecessary repetitions detected
- À investiguer (pages > 1000 lignes suspectes de logique dupliquée).

## 18. UX/UI improvements
- À venir.

## 19. Accessibility checks performed
- Pas encore.

## 20. Security / production-readiness risks
- 40 vulnérabilités Dependabot sur main (1 critique) — vérifier si toujours présentes après le commit sécurité 9d52283.
- Chunk PDF 1.49 MB (perf).
- Couverture de tests quasi nulle (3 fichiers).

## 21. Exact next steps
1. Batch 1 : corriger les 116 lint errors (surtout `any`) par petits lots + re-lint/typecheck/build.
2. Batch 2 : `npm run audit:security` + traiter vulnérabilités critiques/high.
3. Batch 3 : audit flows critiques (auth → création projet → proposition → contrat → paiement) via lecture code + Playwright.
4. Batch 4 : responsive 5 breakpoints via Playwright screenshots.
5. Batch 5 : accessibilité de base.
6. Batch 6 : dé-duplication / découpage des pages géantes (proposition avant refactor massif).

## 22. What must not be forgotten
- Ne jamais déclarer « 100% production-ready » ; toujours « selon les validations suivantes ».
- Mettre à jour ce fichier après chaque batch.
- docs/user-stories-client-audit.md existe déjà — le lire avant l'audit des flows client pour ne pas dupliquer le travail.
