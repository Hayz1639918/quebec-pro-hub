# 🏗️ BâtirNet

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Plateforme de mise en relation entre clients et entrepreneurs du bâtiment**

[Démarrage rapide](#-démarrage-rapide) •
[Documentation](#-documentation) •
[Contribution](#-contribution)

</div>

---

## 📋 À propos

BâtirNet est une plateforme web sécurisée connectant des clients (particuliers/entreprises) avec des entrepreneurs du bâtiment qualifiés. La plateforme offre:

- 🔐 **Vérification RBQ** - Validation des licences professionnelles
- 📝 **Contrats intelligents** - E-signature et paiements par jalons
- ⭐ **Évaluations riches** - Système de notation multicritères
- 🌍 **Multilingue** - Interface FR/EN complète
- 🗺️ **Géolocalisation** - Recherche par proximité avec carte interactive

## 🛠️ Stack technique

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI** | Tailwind CSS, shadcn/ui, Radix UI |
| **State** | TanStack Query, React Router |
| **Backend** | Supabase (Auth, Database, Storage, Realtime) |
| **Maps** | React Leaflet, OpenStreetMap |
| **PDF** | @react-pdf/renderer |
| **i18n** | react-i18next |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte [Supabase](https://supabase.com) (gratuit)

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-org/batirnet.git
cd batirnet

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# 4. Lancer le serveur de développement
npm run dev
```

### Variables d'environnement

Créez un fichier `.env` à la racine:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre-cle-anon-publique

# Optionnel: emails transactionnels de signature (via Edge Function)
RESEND_API_KEY=votre-cle-resend
SIGNATURE_EMAIL_FROM=BâtirNet <signatures@votre-domaine.com>
```

> ⚠️ N'utilisez jamais la clé `service_role` côté client!

## 📁 Structure du projet

```
batirnet/
├── src/
│   ├── components/     # Composants React réutilisables
│   │   ├── ui/         # Composants shadcn/ui
│   │   ├── dashboard/  # Composants du dashboard
│   │   ├── forms/      # Formulaires
│   │   └── map/        # Carte interactive
│   ├── pages/          # Pages de l'application
│   ├── hooks/          # Hooks React personnalisés
│   ├── lib/            # Utilitaires et helpers
│   ├── i18n/           # Traductions FR/EN
│   └── integrations/   # Clients externes (Supabase)
├── supabase/
│   └── migrations/     # Scripts SQL de migration
├── docs/               # Documentation technique
├── scripts/            # Scripts utilitaires
└── public/             # Assets statiques
```

## 📜 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | Vérification ESLint |
| `npm run test` | Tests unitaires |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Rapport de couverture |

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | Vue d'ensemble technique |
| [Authentication](docs/authentication.md) | Système d'authentification |
| [Supabase Setup](docs/supabase-setup.md) | Configuration de la base de données |
| [Features](docs/features.md) | Liste des fonctionnalités |
| [Security](docs/security.md) | Bonnes pratiques de sécurité |
| [i18n](docs/i18n-implementation.md) | Internationalisation |

## 🗄️ Base de données

Les migrations Supabase sont dans `supabase/migrations/`. Pour les appliquer:

1. Allez dans votre projet Supabase → SQL Editor
2. Exécutez les fichiers dans l'ordre numérique (001, 002, ...)

Voir [supabase/README.md](supabase/README.md) pour plus de détails.

## 🚢 Déploiement

```bash
# Build de production
npm run build

# Le dossier dist/ est prêt pour déploiement
```

Plateformes recommandées:
- **Vercel** - Déploiement automatique depuis GitHub
- **Netlify** - Simple et gratuit
- **Cloudflare Pages** - Rapide et global

> N'oubliez pas de configurer les variables `VITE_*` sur votre plateforme.

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'feat: add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

### Conventions de commit

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

## 📄 Licence

Ce projet est propriétaire. Contactez les mainteneurs pour les conditions d'utilisation.

---

BâtirNet — Québec, Canada.
