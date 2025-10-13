# Guide de test — BâtirNet

## Tests de l'inscription et authentification

Ce guide vous aide à tester les nouvelles fonctionnalités d'inscription pour clients et professionnels.

## Prérequis

Avant de tester, assurez-vous que :

1. **Supabase est configuré**
   - Projet Supabase créé
   - Variables d'environnement configurées dans `.env`
   - Migrations appliquées (table `profiles` créée)
   - Bucket `certifications` créé

2. **Application démarrée**
   ```bash
   npm install
   npm run dev
   ```
   L'application devrait être accessible sur `http://localhost:8080`

## Scénarios de test

### Test 1 : Inscription Client

**Objectif** : Vérifier qu'un client peut s'inscrire avec succès

**Étapes** :
1. Aller sur `http://localhost:8080/auth`
2. Cliquer sur "Pas encore de compte ? S'inscrire"
3. Rester sur l'onglet "Client"
4. Remplir le formulaire :
   - Email : `client-test@example.com`
   - Mot de passe : `test123456`
   - Nom complet : `Jean Client`
   - Téléphone : `(514) 123-4567` (optionnel)
5. Cliquer sur "Créer mon compte"

**Résultat attendu** :
- ✅ Message de succès "Inscription réussie ! 🎉"
- ✅ Redirection vers la page d'accueil
- ✅ Utilisateur connecté

**Vérification dans Supabase** :
```sql
SELECT * FROM profiles WHERE email = 'client-test@example.com';
-- Devrait retourner 1 ligne avec user_type = 'client'
```

---

### Test 2 : Inscription Professionnel avec RBQ

**Objectif** : Vérifier qu'un professionnel peut s'inscrire avec certification RBQ

**Étapes** :
1. Aller sur `http://localhost:8080/auth`
2. Cliquer sur "Pas encore de compte ? S'inscrire"
3. Cliquer sur l'onglet "Professionnel"
4. Remplir le formulaire :
   - Email : `pro-test@example.com`
   - Mot de passe : `test123456`
   - Nom complet : `Pierre Entrepreneur`
   - Téléphone : `(514) 987-6543`
   - Nom de l'entreprise : `Construction ABC Inc.`
   - Numéro RBQ : `1234-5678-01`
   - Services offerts : `Rénovation résidentielle, construction neuve`
   - Assurance : `Assurance XYZ, Police #123456`
5. Télécharger un fichier de certification RBQ (PDF, JPG ou PNG)
6. Cliquer sur "Créer mon compte"

**Résultat attendu** :
- ✅ Message de succès avec mention de vérification RBQ
- ✅ Redirection vers la page d'accueil
- ✅ Utilisateur connecté

**Vérification dans Supabase** :
```sql
-- Vérifier le profil
SELECT * FROM profiles WHERE email = 'pro-test@example.com';
-- Devrait retourner 1 ligne avec :
-- - user_type = 'professional'
-- - company_name = 'Construction ABC Inc.'
-- - rbq_number = '1234-5678-01'
-- - rbq_certification_url != NULL
-- - is_rbq_verified = false (par défaut)

-- Vérifier le fichier uploadé
SELECT * FROM storage.objects 
WHERE bucket_id = 'certifications' 
AND name LIKE '%rbq%';
```

---

### Test 3 : Validation des champs requis (Professionnel)

**Objectif** : Vérifier que les champs obligatoires sont bien validés

**Étapes** :
1. Aller sur l'onglet "Professionnel"
2. Essayer de soumettre le formulaire sans remplir tous les champs

**Tests à effectuer** :
- ❌ Sans email → Erreur navigateur "Please fill out this field"
- ❌ Sans mot de passe → Erreur navigateur
- ❌ Mot de passe < 6 caractères → Erreur navigateur
- ❌ Sans nom complet → Erreur navigateur
- ❌ Sans nom d'entreprise → Toast "Champs requis manquants"
- ❌ Sans numéro RBQ → Toast "Champs requis manquants"
- ❌ Sans certification RBQ → Toast "Certification RBQ requise"

**Résultat attendu** :
- ✅ Tous les champs requis sont validés
- ✅ Messages d'erreur clairs et précis

---

### Test 4 : Validation du fichier RBQ

**Objectif** : Vérifier que seuls les bons formats de fichiers sont acceptés

**Étapes** :
1. Onglet "Professionnel"
2. Essayer d'uploader différents types de fichiers

**Tests à effectuer** :
- ✅ PDF → Accepté
- ✅ JPG → Accepté
- ✅ PNG → Accepté
- ❌ .doc/.docx → Toast "Format de fichier invalide"
- ❌ .txt → Toast "Format de fichier invalide"
- ❌ Fichier > 5 Mo → Toast "Fichier trop volumineux"

**Résultat attendu** :
- ✅ Validation des types de fichiers fonctionne
- ✅ Validation de la taille fonctionne
- ✅ Icône CheckCircle2 s'affiche quand fichier valide uploadé

---

### Test 5 : Connexion

**Objectif** : Vérifier qu'un utilisateur peut se connecter

**Étapes** :
1. Se déconnecter (si connecté)
2. Aller sur `/auth`
3. Remplir le formulaire de connexion :
   - Email : `client-test@example.com`
   - Mot de passe : `test123456`
4. Cliquer sur "Se connecter"

**Résultat attendu** :
- ✅ Message "Connexion réussie"
- ✅ Redirection vers la page d'accueil
- ✅ Utilisateur connecté

**Test avec mauvais mot de passe** :
- ❌ Toast "Email ou mot de passe incorrect"

---

### Test 6 : OAuth Google (si configuré)

**Objectif** : Vérifier que l'authentification Google fonctionne

**Prérequis** : OAuth Google configuré dans Supabase

**Étapes** :
1. Cliquer sur "Continuer avec Google"
2. Sélectionner un compte Google
3. Autoriser l'application

**Résultat attendu** :
- ✅ Redirection vers Google OAuth
- ✅ Retour vers l'application après autorisation
- ✅ Utilisateur connecté

---

### Test 7 : Basculement Client/Professionnel

**Objectif** : Vérifier que le changement d'onglet fonctionne correctement

**Étapes** :
1. Page d'inscription
2. Remplir quelques champs en mode "Client"
3. Basculer vers "Professionnel"
4. Vérifier que les champs communs sont conservés
5. Vérifier que les nouveaux champs professionnels apparaissent

**Résultat attendu** :
- ✅ Les champs communs (email, password, nom, téléphone) sont conservés
- ✅ Les champs professionnels apparaissent/disparaissent selon l'onglet
- ✅ Transition fluide entre les onglets

---

### Test 8 : Messages et feedback utilisateur

**Objectif** : Vérifier que tous les messages sont clairs et en français

**Éléments à vérifier** :
- ✅ Titres des pages en français
- ✅ Labels des champs en français
- ✅ Placeholders pertinents
- ✅ Messages d'erreur en français
- ✅ Messages de succès en français
- ✅ Icônes appropriées (CheckCircle2 pour succès, Upload pour upload, etc.)

---

## Tests de sécurité

### Test S1 : Row Level Security (RLS)

**Objectif** : Vérifier que les utilisateurs ne peuvent accéder qu'à leurs propres données

**Étapes** :
1. Créer deux comptes différents
2. Se connecter avec le compte 1
3. Essayer de lire le profil du compte 2 via console navigateur :
   ```javascript
   const { data, error } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', 'id-du-compte-2');
   ```

**Résultat attendu** :
- ❌ Aucune donnée retournée (RLS bloque)

---

### Test S2 : Storage Policies

**Objectif** : Vérifier que les certifications RBQ sont protégées

**Étapes** :
1. Se connecter avec le compte 1
2. Essayer d'accéder au fichier RBQ du compte 2 :
   ```javascript
   const { data, error } = await supabase.storage
     .from('certifications')
     .download('rbq-certifications/id-compte-2-rbq-xxx.pdf');
   ```

**Résultat attendu** :
- ❌ Erreur d'accès refusé

---

## Tests de performance

### Test P1 : Upload de fichier volumineux

**Objectif** : Vérifier la gestion des fichiers volumineux

**Étapes** :
1. Créer un fichier PDF de 4.5 Mo
2. L'uploader dans le formulaire professionnel
3. Soumettre le formulaire

**Résultat attendu** :
- ✅ Upload réussi (< 5 Mo)
- ✅ Temps de chargement raisonnable

---

### Test P2 : Fichier trop volumineux

**Étapes** :
1. Créer un fichier PDF de 6 Mo
2. Essayer de l'uploader

**Résultat attendu** :
- ❌ Toast "Fichier trop volumineux"
- ✅ Fichier rejeté avant l'upload

---

## Vérification manuelle dans Supabase

### Vérifier les profils créés

```sql
-- Lister tous les profils
SELECT 
  id,
  email,
  full_name,
  user_type,
  company_name,
  rbq_number,
  is_rbq_verified,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Compter par type
SELECT user_type, COUNT(*) as count
FROM profiles
GROUP BY user_type;
```

### Vérifier les fichiers uploadés

```sql
-- Lister les certifications RBQ
SELECT 
  name,
  bucket_id,
  created_at,
  (metadata->>'size')::int / 1024 as size_kb
FROM storage.objects
WHERE bucket_id = 'certifications'
ORDER BY created_at DESC;
```

### Vérifier un professionnel en attente

```sql
-- Professionnels non vérifiés
SELECT 
  email,
  full_name,
  company_name,
  rbq_number,
  rbq_certification_url,
  created_at
FROM profiles
WHERE user_type = 'professional' 
  AND is_rbq_verified = false
ORDER BY created_at DESC;
```

### Vérifier un professionnel

```sql
-- Approuver un professionnel
UPDATE profiles
SET is_rbq_verified = true
WHERE email = 'pro-test@example.com';
```

---

## Nettoyage après tests

Pour nettoyer les données de test :

```sql
-- Supprimer les profils de test
DELETE FROM profiles 
WHERE email IN ('client-test@example.com', 'pro-test@example.com');

-- Note: Les utilisateurs dans auth.users seront aussi supprimés grâce au ON DELETE CASCADE
```

Pour supprimer les fichiers de test du Storage :
1. Aller dans Storage > certifications
2. Supprimer manuellement les fichiers de test

---

## Checklist complète

Avant de considérer que tout fonctionne :

- [ ] Test 1 : Inscription client réussie
- [ ] Test 2 : Inscription professionnel réussie
- [ ] Test 3 : Validation des champs requis
- [ ] Test 4 : Validation du fichier RBQ
- [ ] Test 5 : Connexion réussie
- [ ] Test 6 : OAuth Google (optionnel)
- [ ] Test 7 : Basculement onglets
- [ ] Test 8 : Messages en français
- [ ] Test S1 : RLS fonctionne
- [ ] Test S2 : Storage Policies fonctionnent
- [ ] Test P1 : Upload fichier volumineux
- [ ] Test P2 : Rejet fichier trop gros
- [ ] Vérification Supabase : Profils créés
- [ ] Vérification Supabase : Fichiers uploadés
- [ ] Aucune erreur console navigateur
- [ ] Aucune erreur linter

---

## Problèmes courants et solutions

### Problème : "relation profiles does not exist"
**Solution** : Appliquez la migration SQL depuis `supabase/migrations/001_create_profiles_table.sql`

### Problème : "Storage bucket not found"
**Solution** : La migration devrait créer le bucket automatiquement. Sinon, créez-le manuellement dans Supabase Dashboard.

### Problème : "new row violates row-level security policy"
**Solution** : Vérifiez que les policies RLS sont bien créées via la migration.

### Problème : Fichier RBQ n'est pas uploadé
**Solution** : 
1. Vérifiez que le bucket `certifications` existe
2. Vérifiez les policies du Storage
3. Regardez la console navigateur pour les erreurs

### Problème : "duplicate key value violates unique constraint"
**Solution** : Un profil existe déjà pour cet email. Utilisez un autre email ou supprimez l'ancien profil.

---

## Ressources

- Documentation Supabase : https://supabase.com/docs
- Guide d'authentification : `docs/authentication.md`
- Configuration Supabase : `supabase/README.md`

