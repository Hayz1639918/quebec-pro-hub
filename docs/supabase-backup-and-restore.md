# Sauvegarde Supabase gratuite

Le workflow `Encrypted Supabase Backup` crée chaque dimanche une sauvegarde
logique de la base de données et une copie des fichiers Supabase Storage. Il
peut également être lancé manuellement depuis GitHub Actions.

La sauvegarde est chiffrée en AES-256 avant son téléversement comme artefact
GitHub. Seuls le fichier chiffré et sa somme SHA-256 quittent le runner. La
rétention est de 30 jours, ce qui conserve normalement quatre points de
restauration hebdomadaires sans ajouter un service payant.

## Secrets GitHub requis

Dans `Settings > Secrets and variables > Actions`, créer les trois secrets
suivants :

1. `SUPABASE_DB_URL` : chaîne de connexion **Session pooler** du projet de
   production, incluant le mot de passe de la base de données.
2. `SUPABASE_SERVICE_ROLE_KEY` : clé secrète `service_role` du projet de
   production. Elle sert uniquement à lire les buckets privés pendant la
   sauvegarde.
3. `BACKUP_ENCRYPTION_PASSPHRASE` : phrase secrète aléatoire d'au moins
   32 caractères, conservée aussi dans un gestionnaire de mots de passe hors
   de GitHub. Sans cette phrase, une sauvegarde ne peut pas être déchiffrée.

Ne jamais placer ces valeurs dans le dépôt, un fichier `.env` commité, un
ticket ou les logs d'une Action.

## Première validation

Après l'ajout des secrets :

1. Ouvrir `Actions > Encrypted Supabase Backup`.
2. Cliquer sur `Run workflow` depuis `main`.
3. Vérifier que le job `Database and Storage` est vert.
4. Télécharger l'artefact et conserver la phrase de chiffrement hors GitHub.

## Vérifier et ouvrir une sauvegarde

Depuis un répertoire contenant les deux fichiers téléchargés :

```bash
sha256sum -c batirnet-supabase-<run-id>.tar.gz.enc.sha256
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in batirnet-supabase-<run-id>.tar.gz.enc \
  -out batirnet-supabase-<run-id>.tar.gz
mkdir batirnet-supabase-restore
tar -C batirnet-supabase-restore -xzf batirnet-supabase-<run-id>.tar.gz
```

OpenSSL demandera la valeur de `BACKUP_ENCRYPTION_PASSPHRASE` sans l'afficher.

## Procédure de restauration

Toujours tester la restauration dans un **nouveau projet Supabase vide**. Ne
jamais commencer par écraser directement la production.

1. Créer le nouveau projet et activer les mêmes extensions que la production.
2. Récupérer sa chaîne de connexion Session pooler.
3. Restaurer les rôles, le schéma, puis les données avec `psql` et
   `ON_ERROR_STOP=1`.
4. Recréer les paramètres Auth, les secrets des Edge Functions et les autres
   réglages qui ne font pas partie de PostgreSQL.
5. Réimporter les fichiers présents sous `storage/<bucket>/<path>` dans les
   buckets correspondants en utilisant `storage-manifest.json` comme
   inventaire.
6. Exécuter les assertions SQL du dossier `supabase/tests` avant toute bascule.

Les sauvegardes logiques ne remplacent pas le Point-in-Time Recovery de l'offre
payante : la perte maximale possible reste d'environ sept jours avec la
planification hebdomadaire. Le workflow peut être changé en exécution
quotidienne si l'utilisation réelle de la bêta le justifie.
