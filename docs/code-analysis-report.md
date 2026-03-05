# Rapport d'analyse de code — Québec Pro Hub (BâtirNet)

> **Date :** 5 mars 2026
> **Analysé par :** Claude Code (Sonnet 4.6)
> **Référentiel de best practices :** [dronezzzko/software-development-best-practices](https://github.com/dronezzzko/software-development-best-practices)
> **Branche :** `claude/code-analysis-report-0XJw1`

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Points forts — Ce qui est bien fait](#2-points-forts--ce-qui-est-bien-fait)
3. [Problèmes critiques (P0)](#3-problèmes-critiques-p0)
4. [Problèmes importants (P1)](#4-problèmes-importants-p1)
5. [Améliorations recommandées (P2)](#5-améliorations-recommandées-p2)
6. [Dette technique (P3)](#6-dette-technique-p3)
7. [Tableau de synthèse par catégorie](#7-tableau-de-synthèse-par-catégorie)
8. [Plan d'action prioritaire](#8-plan-daction-prioritaire)

---

## 1. Vue d'ensemble du projet

| Critère | Valeur |
|---|---|
| **Stack principale** | React 18 + TypeScript + Vite + Supabase |
| **UI** | TailwindCSS + Radix UI (shadcn/ui) |
| **State** | TanStack Query v5 + useState local |
| **Auth/DB** | Supabase (PostgreSQL + RLS + Auth) |
| **i18n** | react-i18next (FR + EN) |
| **Tests** | Vitest + Testing Library |
| **Deploy** | Vercel |
| **Nombre de pages** | ~30 pages |
| **Migrations SQL** | 45 migrations |
| **Fichiers source (~src)** | ~130 fichiers |
| **Lignes de code (pages seules)** | ~18 000 lignes |

Le projet est une **marketplace B2B pour le secteur de la construction au Québec**, connectant des clients avec des professionnels détenteurs de licences RBQ (Régie du bâtiment du Québec). Les fonctionnalités couvertes incluent : gestion de projets, appels d'offres, messagerie temps réel, contrats avec e-signature, sous-traitance, KPIs, calendrier, et un panneau d'administration.

---

## 2. Points forts — Ce qui est bien fait

### 2.1 Architecture & Performance

**Code splitting et lazy loading bien implémentés** (`src/App.tsx:9-45`)

```tsx
// ✅ Toutes les pages sont lazy-loadées
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
// ...
```

Couplé à une configuration Vite optimisée (`vite.config.ts:29-84`) qui segmente manuellement les chunks par domaine fonctionnel (react core, UI, maps, PDF, charts, i18n), ce qui réduit considérablement le bundle initial.

**Error Boundary global** (`src/components/ErrorBoundary.tsx`) wrappant l'ensemble de l'application avec affichage conditionnel du stack trace selon l'environnement (`NODE_ENV`).

### 2.2 Sécurité

**Row Level Security (RLS) systématique** — 45 migrations SQL montrent un usage rigoureux de RLS Supabase sur toutes les tables sensibles.

**Vérification admin server-side** (`supabase/migrations/039_add_admin_system.sql`) — L'accès admin est vérifié via une fonction RPC `SECURITY DEFINER`, jamais côté client seul :

```sql
-- ✅ Principe du moindre privilège, vérification serveur
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE);
END; $$;
```

**Audit trail complet** pour toutes les actions administratives (vérification/rejet RBQ) avec journalisation des valeurs avant/après.

**SHA-256 pour l'intégrité des e-signatures** (`src/services/signature-service.ts:33-38`) — Hash du document et de la signature pour détecter toute altération post-signature.

**Headers de sécurité HTTP** (`server/index.js:63-72`) — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` avec CORS basé sur whitelist.

**DOMPurify utilisé** dans les composants exposés à du HTML dynamique (`ContractViewer.tsx`, `ProposeContract.tsx`).

**Validation des variables d'environnement** au démarrage avec message d'erreur utilisateur en production (`src/integrations/supabase/client.ts:8-41`).

### 2.3 Qualité de code

**TypeScript partout** — Interfaces bien définies pour les entités métier (`DashboardStats`, `PendingVerification`, `AuditLog`, etc.).

**Internationalisation complète** — Fichiers de traduction `fr.json` (~50KB) et `en.json` (~47KB), switcher de langue fonctionnel.

**Organisation claire des migrations** — Numérotées séquentiellement avec des migrations correctement commentées et documentées (README_007.md, README_008.md).

**Documentation projet** — Dossier `docs/` avec 15 fichiers couvrant architecture, auth, payments, security, testing-guide, roadmap, etc.

**Changelog maintenu** — `CHANGELOG.md` présent.

**`useCallback` sur les fonctions de fetch** dans `AdminDashboard.tsx` pour éviter les re-renders inutiles dans les `useEffect`.

---

## 3. Problèmes critiques (P0)

> Ces problèmes peuvent causer des bugs en production, des failles de sécurité ou une dégradation majeure de l'expérience utilisateur.

### P0-01 — TypeScript strict désactivé

**Fichier :** `tsconfig.app.json:20-25`

```json
// ❌ Toutes les garanties TypeScript sont désactivées
"strict": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"noImplicitAny": false,
"noFallthroughCasesInSwitch": false
```

**Impact :** Les `any` implicites, les variables non utilisées, les paramètres manquants ne génèrent aucune erreur. Le projet contient **84 usages de `any`** dans le code applicatif. TypeScript devient un outil de documentation plutôt qu'un outil de prévention des bugs. Les refactorings ne sont pas sûrs.

**Correction :** Activer `"strict": true` progressivement en corrigeant les erreurs par module.

---

### P0-02 — Couverture de tests quasi-nulle

**Fichier :** `src/components/__tests__/hero.test.tsx`

Il n'existe qu'**un seul fichier de test** pour l'ensemble du projet (~130 fichiers source). Ce fichier contient en réalité **3 assertions identiques** :

```tsx
// ❌ Les 3 tests vérifient exactement la même chose
it('shows key stats', () => {
  expect(screen.getByText(/Connectez-vous/i)).toBeInTheDocument(); // test 1
  expect(screen.getByText(/Connectez-vous/i)).toBeInTheDocument(); // test 2 (copie)
  expect(screen.getByText(/Connectez-vous/i)).toBeInTheDocument(); // test 3 (copie)
});
```

**Aucun test pour :**
- La logique d'authentification et les redirections (`Auth.tsx`)
- Le `SignatureService` (SHA-256, vérification d'intégrité)
- Les hooks personnalisés
- Les formulaires (validation, soumission)
- Les composants critiques (Dashboard, Contracts, AdminDashboard)
- Les services Supabase

**Impact :** Tout changement peut introduire des régressions silencieuses sur les flux critiques (auth, contrats, paiements).

**Correction :** Viser une couverture ≥70% sur les services et hooks critiques. Commencer par `signature-service.ts`, `Auth.tsx`, les formulaires.

---

### P0-03 — Email de confirmation de signature non implémenté

**Fichier :** `src/services/signature-service.ts:119-128`

```ts
// ❌ L'envoi d'email de confirmation de signature n'est qu'un console.log
async sendSignatureConfirmationEmail(...): Promise<boolean> {
  try {
    // Pour l'instant, on simule l'envoi d'email
    console.log('Email de confirmation envoyé:', { ... });
    return true; // Retourne toujours true = jamais d'erreur détectée
  }
}
```

**Impact :** Les parties signataires ne reçoivent **jamais** de confirmation de signature par email en production. La méthode retourne `true` inconditionnellement, masquant cette lacune dans les logs. Pour un système de contrats juridiquement sensibles, c'est une fonctionnalité critique manquante.

**Correction :** Intégrer un service d'email transactionnel (Resend, SendGrid) via une Supabase Edge Function pour envoyer les confirmations.

---

### P0-04 — Route `/admin` sans protection au niveau du routeur

**Fichier :** `src/App.tsx:102`

```tsx
// ❌ Aucun guard de route — protection uniquement dans le composant
<Route path="/admin" element={<AdminDashboard />} />
```

**Impact :** Avant que `AdminDashboard` charge et vérifie les droits via RPC, la page est momentanément accessible. Plus important, l'absence de routes protégées au niveau du routeur signifie que si un développeur oublie d'ajouter la vérification dans un futur composant admin, l'accès est ouvert. Le pattern n'est pas scalable.

**Correction :** Créer un composant `<ProtectedRoute roles={['admin']}>` wrappant les routes sensibles.

---

### P0-05 — RLS trop permissive sur `admin_audit_logs`

**Fichier :** `supabase/migrations/039_add_admin_system.sql:67-71`

```sql
-- ❌ N'importe quel utilisateur authentifié peut insérer des logs d'audit
CREATE POLICY "System can insert audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (TRUE);
```

**Impact :** Un utilisateur authentifié peut insérer de faux logs d'audit directement via l'API Supabase, falsifiant la piste d'audit et potentiellement masquant des actions malveillantes.

**Correction :** Retirer cette politique et s'assurer que seules les fonctions `SECURITY DEFINER` insèrent dans cette table. Utiliser `GRANT INSERT ON admin_audit_logs TO NONE` et laisser uniquement les fonctions RPC écrire dans cette table.

---

## 4. Problèmes importants (P1)

### P1-01 — `setTimeout` pour la navigation (race conditions)

**Fichiers :** `src/pages/Auth.tsx:162`, `src/pages/Auth.tsx:219`

```tsx
// ❌ Utilisation de setTimeout pour la navigation post-auth
setTimeout(() => {
  navigate("/complete-profile");
}, 1500);
```

**Impact :** Si le composant est démonté avant la fin du timeout (retour arrière, navigation rapide), la navigation se déclenche sur un composant démonté. Risque de memory leak et de comportements inattendus. Le délai de 1.5s est arbitraire et nuit à l'UX.

**Correction :** Utiliser la navigation directe dans le callback `onAuthStateChange` déjà en place, ou utiliser `useNavigate` avec une gestion d'état propre.

---

### P1-02 — Logique `redirectBasedOnProfile` dupliquée

**Fichier :** `src/pages/Auth.tsx:33-52` et `src/pages/Auth.tsx:218-242`

La même logique de redirection basée sur le profil est copié-collée deux fois dans le même fichier (dans `useEffect` et dans `handleLogin`). Toute modification doit être faite en deux endroits.

**Correction :** Extraire dans un custom hook `useAuthRedirect()` ou une fonction utilitaire.

---

### P1-03 — 189 `console.log/error/warn` en production

```bash
$ grep -r "console\." src/ | wc -l
189
```

**Impact :** En production, ces logs peuvent exposer des données sensibles (structures de données, réponses d'API, informations utilisateur) dans la console du navigateur. Exemples trouvés : `console.log('Email de confirmation envoyé:', { contractId, recipientEmail, verificationCode })`.

**Correction :** Utiliser une bibliothèque de logging (`pino`, `winston`, custom logger) qui respecte `NODE_ENV`. En développement : verbose. En production : errors seulement, sans données sensibles.

---

### P1-04 — Ouverture d'URL non validée depuis la base de données

**Fichier :** `src/pages/AdminDashboard.tsx:871`

```tsx
// ❌ URL provenant de la DB ouverte sans validation
onClick={() => window.open(selectedProfessional.rbq_certification_url!, '_blank')}
```

**Impact :** Si un professionnel malveillant soumet une URL `javascript:` ou une URL de phishing comme URL de certification, elle sera ouverte par l'admin. Absence de `rel="noopener noreferrer"`.

**Correction :**
```tsx
// ✅
const url = new URL(selectedProfessional.rbq_certification_url!);
if (['https:', 'http:'].includes(url.protocol)) {
  window.open(url.href, '_blank', 'noopener,noreferrer');
}
```

---

### P1-05 — IP client falsifiable dans le service de signature

**Fichier :** `src/services/signature-service.ts:49-59`, `server/index.js:121-125`

```js
// Le serveur fait confiance à X-Forwarded-For sans validation
const xf = req.headers['x-forwarded-for'];
const ip = (forwarded.split(',')[0] || ...).trim();
```

**Impact :** Le header `X-Forwarded-For` peut être forgé par n'importe quel client HTTP. L'adresse IP stockée dans la piste d'audit des signatures n'est donc **pas fiable** et ne pourrait pas servir de preuve juridique.

**Correction :** En production sur Vercel, utiliser l'IP réelle fournie par Vercel via les headers de la plateforme (Vercel injecte `x-real-ip` qui ne peut pas être forgé). Documenter clairement cette limitation.

---

### P1-06 — `package.json` avec nom générique de template

**Fichier :** `package.json:2`

```json
"name": "vite_react_shadcn_ts"
```

C'est le nom par défaut du template Vite. Non mis à jour au nom du projet.

---

### P1-07 — Aucune configuration Prettier

Le script `"format": "prettier --write ..."` est défini dans `package.json` mais aucun fichier `.prettierrc` n'existe dans le projet. Prettier utilisera ses valeurs par défaut, ce qui peut différer des conventions attendues par l'équipe.

**Correction :** Créer un `.prettierrc.json` avec la configuration de style choisie (semi, singleQuote, tabWidth, etc.).

---

### P1-08 — Pages mastodontes (1000+ lignes)

| Fichier | Lignes |
|---|---|
| `Dashboard.tsx` | 1 464 |
| `ProjectDetails.tsx` | 1 149 |
| `AdminDashboard.tsx` | 1 054 |
| `ProposeContract.tsx` | 1 001 |
| `Professionals.tsx` | 974 |
| `NewProject.tsx` | 961 |

**Impact :** Ces composants mélangent logique de data fetching, logique métier et rendu. Difficulté de maintenabilité, de testabilité et de réutilisation. Violation du **Single Responsibility Principle**.

**Correction :** Extraire la logique de data fetching dans des hooks custom (`useProjects`, `useProfessionals`, `useDashboardData`), et décomposer le rendu en sous-composants.

---

### P1-09 — Seulement 2 custom hooks pour ~30 pages

**Répertoire :** `src/hooks/` — Contient uniquement `use-mobile.tsx` et `use-toast.ts`.

Toute la logique Supabase (requêtes, subscriptions realtime, mutations) est directement dans les composants de page. Aucun custom hook pour encapsuler les opérations fréquentes (`useAuth`, `useProfile`, `useProjects`, etc.).

**Impact :** Logique dupliquée entre pages similaires, code difficile à tester unitairement.

---

### P1-10 — Gap dans la numérotation des migrations (029, 030 manquants)

Les migrations vont de `028_allow_users_delete_own_templates.sql` directement à `031_project_workflow_notifications.sql`. Les migrations 029 et 030 semblent avoir été supprimées ou jamais créées.

**Impact :** En cas de rollback ou de migration sur un nouvel environnement, l'historique est incomplet. Le tooling Supabase peut signaler des incohérences.

---

## 5. Améliorations recommandées (P2)

### P2-01 — Activer `@typescript-eslint/no-unused-vars`

**Fichier :** `eslint.config.js:23`

```js
// ❌ La règle est désactivée — le code mort n'est pas détecté
"@typescript-eslint/no-unused-vars": "off",
```

**Correction :** Passer à `"warn"` ou `"error"` pour détecter le code mort.

---

### P2-02 — Absence de Content Security Policy (CSP)

Le fichier `server/index.js` contient lui-même le commentaire :
```js
// Note: CSP should be added via a reverse proxy or frontend framework
```

Le fichier `vercel.json` n'implémente aucun header CSP. Sans CSP, l'application est plus vulnérable aux attaques XSS (même si DOMPurify est utilisé dans certains endroits).

**Correction :** Ajouter des headers CSP dans `vercel.json` :
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
}
```

---

### P2-03 — Headers de cache manquants pour la sécurité dans `vercel.json`

Le `vercel.json` configure uniquement le cache des assets statiques. Il manque les headers de sécurité globaux (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).

Ces headers sont définis dans `server/index.js` (pour le dev), mais **pas en production Vercel**.

---

### P2-04 — `QueryClient` instancié au niveau module

**Fichier :** `src/App.tsx:47`

```tsx
// ⚠️ Instancié une seule fois au niveau module
const queryClient = new QueryClient();
```

En production c'est acceptable, mais cela rend les tests plus compliqués car le cache est partagé entre les tests. L'approche recommandée est de créer le `QueryClient` dans le composant racine ou via une factory.

---

### P2-05 — Validation de formulaire sans Zod sur certains formulaires

Zod est importé en dépendance, mais plusieurs formulaires (Auth.tsx, CompleteProfile.tsx) utilisent la validation native HTML (`required`, `minLength`) sans validation Zod/react-hook-form pour les règles métier complexes (format RBQ, format code postal québécois, etc.).

---

### P2-06 — `vercel.json` — Réécriture SPA expose l'API

```json
{
  "source": "/((?!api/).*)",
  "destination": "/index.html"
}
```

Toutes les routes qui ne commencent pas par `/api/` sont renvoyées vers le SPA. Cela fonctionne, mais si des routes API backend sont ajoutées sur Vercel Functions à l'avenir, cette règle devrait être revue.

---

### P2-07 — `postal_code` absent de la vue SQL mais présent dans le type TypeScript

**Fichier :** `supabase/migrations/039_add_admin_system.sql:343-363` vs `src/pages/AdminDashboard.tsx:79`

L'interface TypeScript `PendingVerification` inclut `postal_code: string | null` mais la vue SQL `admin_pending_verifications` ne sélectionne pas ce champ. La colonne retournera `undefined` à l'exécution.

---

### P2-08 — Manque de retry/resilience sur les subscriptions Realtime

Le composant `ChatWindow.tsx` s'abonne aux messages via Supabase Realtime mais ne gère pas la reconnexion en cas de perte de connexion réseau. L'utilisateur verrait les messages s'arrêter sans indication.

---

## 6. Dette technique (P3)

### P3-01 — `lovable-tagger` en dépendance de développement

```json
"lovable-tagger": "^1.1.11"
```

C'est un package spécifique à la plateforme Lovable (l'outil qui a initialement généré ce projet). Il n'apporte aucune valeur dans un workflow de développement standard et peut être retiré.

---

### P3-02 — Strings hardcodées en français (hors i18n) dans AdminDashboard

Contrairement aux autres composants qui utilisent `useTranslation()`, `AdminDashboard.tsx` contient la majorité de ses textes hardcodés en français :

```tsx
// ❌ Texte hardcodé — non localisable
<h1>Panneau d'administration</h1>
<p>Gestion des vérifications RBQ</p>
```

---

### P3-03 — Deux systèmes de toast coexistent

```tsx
// App.tsx — Les deux sont importés et utilisés
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
```

Le projet utilise simultanément `useToast` (radix-based) et `sonner`. Manque de cohérence dans les composants : certains utilisent l'un, d'autres l'autre.

---

### P3-04 — `src/integrations/supabase/types.ts` potentiellement désynchronisé

Ce fichier est auto-généré par Supabase mais le commentaire `// This file is automatically generated. Do not edit it directly.` suggère qu'il devrait être regénéré lors de chaque migration. Sans CI/CD vérifiant cette synchronisation, les types peuvent diverger du schéma réel.

---

### P3-05 — Scripts de seed sans validation d'environnement

**Répertoire :** `scripts/`

Les scripts `seed-professionals.js`, `seed-test-projects.js` ne vérifient pas explicitement qu'ils s'exécutent sur un environnement de dev/staging et non production.

---

## 7. Tableau de synthèse par catégorie

| Catégorie | Note | Commentaire |
|---|---|---|
| **Architecture** | 7/10 | Lazy loading, code splitting bien faits. Composants trop gros, manque de custom hooks. |
| **Sécurité** | 7/10 | RLS, audit trail, SHA-256 sont solides. CSP manquant, RLS audit_logs trop permissive, IP non fiable. |
| **TypeScript** | 4/10 | TypeScript présent mais strict désactivé + 84 `any`. La valeur ajoutée est diminuée. |
| **Tests** | 1/10 | 1 fichier de test avec des assertions dupliquées. Couverture quasi-nulle sur les flux critiques. |
| **Performance** | 8/10 | Bundle splitting excellent, lazy loading, React Query pour le cache. |
| **Maintenabilité** | 5/10 | Pages de 1000+ lignes, logique dupliquée (redirectBasedOnProfile), 2 custom hooks seulement. |
| **i18n** | 8/10 | Très bonne implémentation FR/EN, sauf AdminDashboard hardcodé. |
| **Documentation** | 8/10 | Dossier docs/ bien fourni, CHANGELOG, migrations commentées. |
| **Qualité Git** | 6/10 | Messages de commit clairs. Gap migrations 029-030. Pas de convention enforcement (Commitlint). |
| **DX (Dev Experience)** | 7/10 | ESLint + Prettier configurés. no-unused-vars désactivé. Pas de `.prettierrc`. |

**Score global estimé : 6.1/10**

---

## 8. Plan d'action prioritaire

### Semaine 1 — Correctifs critiques

- [ ] **P0-01** : Activer `"strict": true` dans tsconfig et corriger les erreurs TypeScript module par module
- [ ] **P0-03** : Intégrer Resend ou SendGrid pour les emails de confirmation de signature
- [ ] **P0-05** : Corriger la politique RLS sur `admin_audit_logs` (retirer `WITH CHECK (TRUE)`)
- [ ] **P1-04** : Ajouter la validation d'URL + `noopener noreferrer` sur l'ouverture des certifications RBQ

### Semaine 2 — Tests & sécurité

- [ ] **P0-02** : Écrire les tests pour `SignatureService`, `Auth.tsx` (redirections), et les formulaires critiques
- [ ] **P0-04** : Créer un composant `<ProtectedRoute>` pour les routes admin et authentifiées
- [ ] **P2-03** : Ajouter les headers de sécurité dans `vercel.json` (X-Frame-Options, X-Content-Type-Options, HSTS)
- [ ] **P2-02** : Implémenter une CSP de base

### Semaine 3 — Maintenabilité & nettoyage

- [ ] **P1-01/P1-02** : Extraire `redirectBasedOnProfile` en hook, supprimer les `setTimeout`
- [ ] **P1-08/P1-09** : Extraire les hooks (`useAuth`, `useProjects`, `useDashboard`) pour alléger les pages
- [ ] **P1-03** : Remplacer les `console.log` par un logger conditionnel selon `NODE_ENV`
- [ ] **P1-07** : Créer un `.prettierrc.json`
- [ ] **P3-02** : Passer `AdminDashboard` sous i18n
- [ ] **P1-06** : Mettre à jour `name` dans `package.json`

### Continu

- [ ] **P1-09** : Extraire les hooks custom au fil des refactorings
- [ ] **P0-02** : Augmenter progressivement la couverture de tests vers 70%
- [ ] **P3-04** : Ajouter au CI un step `supabase gen types` pour vérifier la synchronisation des types

---

*Ce rapport a été généré en analysant l'ensemble du code source, des migrations SQL, de la configuration et des pratiques de développement selon les standards de [dronezzzko/software-development-best-practices](https://github.com/dronezzzko/software-development-best-practices) — incluant les guidelines OWASP, les principes SOLID, les conventions de Node.js/TypeScript, les best practices de test et les standards de sécurité API.*
