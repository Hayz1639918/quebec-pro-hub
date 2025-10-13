# BâtirNet — Québec Pro Hub

Place de marché sécurisée (Web + mobile) connectant des clients (particuliers/entreprises) avec des entrepreneurs du bâtiment à l’échelle du Canada, avec un fort accent Québec. Différenciation clé: matching intelligent (IA), contrats intelligents avec e‑signature et paiements par jalons, évaluations riches, conformité légale provinciale et UX multilingue FR/EN.

## Stack technique

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui (Radix UI)
- React Router
- TanStack Query
- Supabase JS SDK

## Démarrage rapide

Prérequis:
- Node.js 18+ et npm

Étapes:
1. Cloner le dépôt et se placer dans le dossier du projet.
2. Créer un fichier `.env` à la racine avec vos variables:
   - `VITE_SUPABASE_URL="https://<project>.supabase.co"`
   - `VITE_SUPABASE_PUBLISHABLE_KEY="<public-anon-key>"`
3. Installer les dépendances:
   - `npm i`
4. Lancer le serveur de développement:
   - `npm run dev`
5. Ouvrir l’application sur `http://localhost:8080`.
6. (Optionnel) Lancer l’API locale minimaliste:
   - `npm run server` (expose `http://localhost:5174`)
   - Endpoints de test: `GET /health`, `GET /api/v1/ping`, `POST /api/v1/echo`

Scripts utiles:
- `npm run dev` — démarre le serveur Vite
- `npm run build` — build de production
- `npm run preview` — prévisualisation du build
- `npm run lint` — exécute ESLint
 - `npm run docs` — génère la documentation de code dans `docs/`
 - `npm run test` — exécute la suite de tests Vitest
 - `npm run test:watch` — mode TDD interactif
 - `npm run test:coverage` — rapport de couverture

## Structure du projet

```
src/
  components/        # UI réutilisable et sections (Hero, Features, CTA, etc.)
  components/ui/     # Composants shadcn/ui basés sur Radix
  pages/             # Pages (Index, Auth, Professionals, NotFound)
  integrations/      # Clients externes (Supabase)
  hooks/             # Hooks personnalisés
  assets/            # Images statiques
  main.tsx           # Point d'entrée React
```

## Pages principales

- **`/`** : Page d'accueil avec présentation de la plateforme
- **`/auth`** : Inscription et connexion (client/professionnel)
- **`/professionals`** : Marketplace des professionnels vérifiés RBQ
- **`/auth?mode=signup`** : Inscription directe
- **`/auth?mode=login`** : Connexion directe

## Intégration Supabase

Le client est initialisé via `src/integrations/supabase/client.ts` et attend les variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Assurez-vous d'utiliser uniquement la clé « public anon » côté client.

### Configuration de la base de données

Avant de démarrer l'application, vous devez configurer la base de données Supabase :

1. Créez un projet Supabase sur [supabase.com](https://supabase.com)
2. Appliquez les migrations SQL depuis `supabase/migrations/001_create_profiles_table.sql`
3. Configurez le bucket de stockage pour les certifications RBQ

Pour plus de détails, consultez `supabase/README.md`

## Personnalisation UI

- Les composants UI proviennent de shadcn/ui et Radix. Les styles globaux et thèmes se trouvent dans `tailwind.config.ts`, `src/index.css` et `src/App.css`.
- Pour ajouter/ajuster des composants, modifiez `src/components` et `src/components/ui`.

## Déploiement

1. Construire: `npm run build` (génère `dist/`).
2. Héberger le dossier `dist/` sur un hébergeur statique (Netlify, Vercel, Cloudflare Pages, etc.).
3. Définir les variables d’environnement Vite sur la plateforme d’hébergement (préfixe `VITE_`).

## Backend de développement (plugin backend-development)

Un serveur HTTP minimal sans dépendances est fourni dans `server/index.js` pour prototyper des appels API.

- Démarrer: `npm run server` (port par défaut: `5174`, changeable via `API_PORT`).
- Dev proxy: Vite redirige `\u2060/api/*` vers l’API locale (`vite.config.ts`).
- CORS: activé côté API, mais inutile via le proxy Vite.

Vous pouvez remplacer ce serveur par Express/Fastify ultérieurement si besoin.

## Documentation du code

Générée via TypeDoc (sortie Markdown):
- Config: `typedoc.json`
- Build: `npm run docs` (nécessite `typedoc` et `typedoc-plugin-markdown`)

Installez les dépendances de documentation si nécessaire:
```
npm i -D typedoc typedoc-plugin-markdown
```

## Vue d’ensemble produit

- Différenciation:
  - Matching intelligent (IA) pour recommander les meilleurs entrepreneurs.
  - Contrats intelligents (blockchain) avec e‑signature et jalons de paiement (escrow/paiements en tranches).
  - Système d’évaluation riche (ponctualité, qualité, respect des délais, communication, etc.).
  - Couche légale provinciale (vérifs RBQ/permis/assurances, conformité PIPEDA).
  - UX multilingue FR/EN pour servir des communautés variées.

- Modèle d’affaires:
  - Freemium côté clients, abonnements premium côté entrepreneurs, offre VIP pour clients exigeant un accompagnement.

- Roadmap proposée:
  - MVP → déploiement Québec → Canada → USA/Europe.

Pour le détail, consultez `docs/SUMMARY.md` (sommaire de la documentation).

## TDD & tests (plugin tdd-workflows)

Outils:
- Vitest (+ jsdom)
- React Testing Library + jest-dom

Fichiers clés:
- `vite.config.ts` → section `test` (config Vitest)
- `src/test/setup.ts` → setup jest-dom
- Exemple: `src/components/__tests__/hero.test.tsx`

Installation des dépendances de test:
```
npm i -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Exécution:
- `npm run test:watch` pour itérer en TDD
- `npm run test` pour CI
- `npm run test:coverage` pour la couverture

## Contribution

1. Créez une branche feature.
2. Développez avec `npm run dev`.
3. Vérifiez le linting avec `npm run lint`.
4. Ouvrez une pull request.

## Licence

Ce dépôt ne spécifie pas de licence. Contactez les mainteneurs pour les conditions d’utilisation.
