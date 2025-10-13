# Installation rapide — BâtirNet

Ce guide vous permet de démarrer rapidement avec BâtirNet.

## Prérequis

- **Node.js 18+** et npm
- **Compte Supabase** (gratuit sur [supabase.com](https://supabase.com))

## Installation en 5 étapes

### 1. Cloner et installer les dépendances

```bash
git clone <repository-url>
cd quebec-pro-hub
npm install
```

### 2. Créer un projet Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Créez un nouveau projet
3. Attendez que le projet soit prêt (environ 2 minutes)
4. Notez votre **Project URL** et votre **anon/public key**

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votreprojet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique_anon
```

**Important** : Remplacez les valeurs par celles de votre projet Supabase.

### 4. Configurer la base de données

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Créez une nouvelle query
3. Copiez le contenu du fichier `supabase/migrations/001_create_profiles_table.sql`
4. Collez-le dans l'éditeur
5. Cliquez sur **Run** pour exécuter la migration

Cela va créer :
- La table `profiles` pour stocker les profils utilisateurs
- Le bucket `certifications` pour les fichiers RBQ
- Les policies de sécurité (RLS)

### 5. Démarrer l'application

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:8080**

## Vérification

Pour vérifier que tout fonctionne :

1. Allez sur http://localhost:8080/auth
2. Essayez de créer un compte client
3. Si l'inscription réussit, c'est que tout est bien configuré ! 🎉

## Prochaines étapes

- Consultez `docs/testing-guide.md` pour tester toutes les fonctionnalités
- Consultez `docs/authentication.md` pour comprendre le système d'inscription
- Consultez `supabase/README.md` pour plus de détails sur Supabase

## Problèmes ?

### L'application ne démarre pas
- Vérifiez que Node.js 18+ est installé : `node --version`
- Réinstallez les dépendances : `rm -rf node_modules && npm install`

### Erreur "Supabase URL is required"
- Vérifiez que le fichier `.env` existe à la racine
- Vérifiez que les variables commencent par `VITE_`
- Redémarrez le serveur de développement

### Erreur lors de l'inscription
- Vérifiez que la migration SQL a été appliquée
- Vérifiez dans Supabase > Database > Tables que `profiles` existe
- Vérifiez dans Supabase > Storage que le bucket `certifications` existe

## Structure du projet

```
quebec-pro-hub/
├── src/
│   ├── pages/
│   │   └── Auth.tsx              # Page d'inscription/connexion
│   ├── components/               # Composants réutilisables
│   ├── integrations/
│   │   └── supabase/            # Configuration Supabase
│   └── ...
├── supabase/
│   ├── migrations/              # Migrations SQL
│   └── README.md               # Guide Supabase détaillé
├── docs/                        # Documentation
├── .env                         # Variables d'environnement (à créer)
└── package.json
```

## Commandes utiles

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
npm run test         # Exécuter les tests
npm run docs         # Générer la documentation
```

## Support

Pour plus d'aide, consultez :
- [Documentation complète](docs/SUMMARY.md)
- [Guide de test](docs/testing-guide.md)
- [Documentation Supabase](https://supabase.com/docs)

