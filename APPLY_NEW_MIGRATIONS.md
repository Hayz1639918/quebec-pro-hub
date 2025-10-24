# 🚀 APPLICATION DES NOUVELLES MIGRATIONS

## 📋 **MIGRATIONS À APPLIQUER**

Vous devez appliquer **2 nouvelles migrations** pour activer les fonctionnalités :
1. Portfolio et Galerie
2. Calendrier et Réservations

---

## ✅ **MIGRATION 017 : Portfolio**

### **Ce qui est créé** :
- ✅ Table `portfolio_items` - Projets du portfolio
- ✅ Storage bucket `portfolio-images` - Images
- ✅ Fonction de validation `validate_portfolio_professional()`
- ✅ Trigger de validation
- ✅ RLS policies complètes
- ✅ Indexes optimisés

### **Instructions** :

1. **Ouvrir Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionner votre projet** : `gsnjnhxzacwjslirfxgy`
3. **Aller dans** : `SQL Editor` (menu de gauche)
4. **Cliquer sur** : `+ New query`
5. **Copier-coller** le contenu du fichier : `supabase/migrations/017_add_portfolio.sql`
6. **Cliquer sur** : `Run` (ou F5)
7. **Vérifier** : Le message "Success. No rows returned"

---

## ✅ **MIGRATION 018 : Calendrier et Réservations**

### **Ce qui est créé** :
- ✅ Table `professional_availability` - Disponibilités
- ✅ Table `bookings` - Réservations
- ✅ Fonction de validation `validate_availability_professional()`
- ✅ Fonction de validation `validate_booking_users()`
- ✅ Fonction `check_booking_availability()` - Vérification disponibilité
- ✅ Fonction `get_upcoming_bookings()` - Rendez-vous à venir
- ✅ Triggers de validation
- ✅ RLS policies complètes
- ✅ Indexes optimisés

### **Instructions** :

1. **Dans le même SQL Editor**
2. **Cliquer sur** : `+ New query`
3. **Copier-coller** le contenu du fichier : `supabase/migrations/018_add_calendar_and_bookings.sql`
4. **Cliquer sur** : `Run` (ou F5)
5. **Vérifier** : Le message "Success. No rows returned"

---

## 🔍 **VÉRIFICATION DES MIGRATIONS**

Après avoir appliqué les 2 migrations, vérifiez qu'elles ont bien été créées :

### **Vérifier les tables** :

```sql
-- Copier-coller cette requête dans SQL Editor
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('portfolio_items', 'professional_availability', 'bookings')
ORDER BY table_name;
```

**Résultat attendu** :
```
portfolio_items             | 8 colonnes
professional_availability   | 9 colonnes
bookings                   | 11 colonnes
```

---

### **Vérifier les fonctions** :

```sql
-- Copier-coller cette requête dans SQL Editor
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'validate_portfolio_professional',
    'validate_availability_professional',
    'validate_booking_users',
    'check_booking_availability',
    'get_upcoming_bookings'
  )
ORDER BY routine_name;
```

**Résultat attendu** : 5 fonctions

---

### **Vérifier le Storage bucket** :

1. **Aller dans** : `Storage` (menu de gauche)
2. **Vérifier** : Le bucket `portfolio-images` existe
3. **Il doit être** : `Public` (icône globe)

Si le bucket n'existe pas :
1. **Cliquer sur** : `New bucket`
2. **Nom** : `portfolio-images`
3. **Public** : ✅ Cocher
4. **Cliquer sur** : `Create bucket`

---

## 🎯 **ROUTES PROFESSIONNELLES DISPONIBLES**

Après application des migrations, ces routes seront fonctionnelles :

### **Dashboard** :
- ✅ `/pro/dashboard` - Vue d'ensemble

### **Profil et Abonnement** :
- ✅ `/pro/profile` - Profil professionnel
- ✅ `/pro/subscription` - Gestion abonnement
- ✅ `/pro/kpis` - Statistiques détaillées

### **Projets et Contrats** :
- ✅ `/projects` - Projets disponibles
- ✅ `/pro/contracts` - **NOUVEAU** - Gestion contrats & jalons
- ✅ `/pro/contract-proposals/new` - Proposer un contrat
- ✅ `/proposals/review` - Réviser propositions

### **Portfolio** :
- ✅ `/pro/portfolio` - **NOUVEAU** - Portfolio & galerie

### **Calendrier** :
- ✅ `/pro/calendar` - **NOUVEAU** - Disponibilités & réservations

### **Équipe** :
- ✅ `/pro/subcontractors` - Sous-traitants
- ✅ `/pro/subcontractor-tasks` - Tâches

### **Évaluations** :
- ✅ `/pro/reviews` - Avis clients & médiation

### **Communication** :
- ✅ `/messages` - Messagerie
- ✅ `/notifications` - Notifications

---

## 🧪 **TESTER LES NOUVELLES FONCTIONNALITÉS**

### **1. Tester le Portfolio** (`/pro/portfolio`) :

1. **Se connecter** en tant que professionnel
2. **Aller sur** : http://localhost:8081/pro/portfolio
3. **Cliquer sur** : "Ajouter un projet"
4. **Uploader** une image (PNG, JPG, max 5 Mo)
5. **Remplir** : Titre, description, catégorie, date
6. **Cliquer sur** : "Ajouter"
7. **Vérifier** : Le projet apparaît dans la galerie

### **2. Tester le Calendrier** (`/pro/calendar`) :

1. **Se connecter** en tant que professionnel
2. **Aller sur** : http://localhost:8081/pro/calendar
3. **Cliquer sur** : "Ajouter disponibilité"
4. **Sélectionner** : Date, heures (début/fin)
5. **Cliquer sur** : "Enregistrer"
6. **Vérifier** : La disponibilité apparaît sur le calendrier

### **3. Tester la Gestion des Contrats** (`/pro/contracts`) :

1. **Se connecter** en tant que professionnel
2. **Aller sur** : http://localhost:8081/pro/contracts
3. **Vérifier** : Les statistiques (contrats actifs, revenus)
4. **Explorer** : Les onglets (Actifs, En attente, Terminés)
5. **Vérifier** : Les jalons de paiement et leur progression

---

## ⚠️ **EN CAS D'ERREUR**

### **Erreur : "relation already exists"**
✅ **Normal** - Les tables existent déjà, migration déjà appliquée

### **Erreur : "function already exists"**
✅ **Normal** - Les fonctions sont créées avec `CREATE OR REPLACE`

### **Erreur : "policy already exists"**
✅ **Normal** - Les policies sont créées avec `DROP POLICY IF EXISTS`

### **Erreur : "bucket already exists"**
✅ **Normal** - Le bucket est créé avec `ON CONFLICT DO NOTHING`

### **Erreur : "cannot use subquery in check constraint"**
❌ **Problème** - Assurez-vous d'utiliser les fichiers corrigés :
- `017_add_portfolio.sql` (avec triggers, sans CHECK subquery)
- `018_add_calendar_and_bookings.sql` (avec triggers, sans CHECK subquery)

---

## 📊 **RÉSUMÉ FINAL**

| Migration | Fichier | Tables | Fonctions | Status |
|-----------|---------|--------|-----------|--------|
| **017** | `017_add_portfolio.sql` | 1 table | 1 fonction | ⚠️ À appliquer |
| **018** | `018_add_calendar_and_bookings.sql` | 2 tables | 4 fonctions | ⚠️ À appliquer |

**Storage** : 1 bucket (`portfolio-images`)

---

## 🎉 **APRÈS APPLICATION**

Une fois les migrations appliquées :

✅ **13 pages professionnelles** opérationnelles  
✅ **18 migrations Supabase** complètes (001 à 018)  
✅ **100% des fonctionnalités** disponibles  
✅ **Prêt pour la production** 🚀

---

**Dernière mise à jour** : 22 Octobre 2025  
**Statut** : ⚠️ **MIGRATIONS EN ATTENTE D'APPLICATION**

