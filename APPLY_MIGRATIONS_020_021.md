# 🔧 Migrations à Appliquer - Corrections RLS

## 📋 **RÉSUMÉ DES PROBLÈMES**

1. **Propositions** : Les RLS policies avec `EXISTS` empêchaient l'insertion de propositions
2. **Notifications** : Les RLS policies empêchaient :
   - La lecture des notifications (erreur 400)
   - L'insertion de notifications par d'autres utilisateurs

---

## 🚀 **ÉTAPES D'APPLICATION**

### **Étape 1 : Appliquer la migration 020 (Propositions)**

1. Aller sur : https://supabase.com/dashboard/project/gsnjnhxzacwjslirfxgy/sql/new
2. Copier-coller le contenu de : `supabase/migrations/020_fix_proposals_rls.sql`
3. Cliquer sur **"Run"**
4. Vérifier qu'il n'y a pas d'erreur

### **Étape 2 : Appliquer la migration 021 (Notifications)**

1. Dans le même SQL Editor, **cliquer sur "New query"**
2. Copier-coller le contenu de : `supabase/migrations/021_fix_notifications_rls.sql`
3. Cliquer sur **"Run"**
4. Vérifier qu'il n'y a pas d'erreur

---

## ✅ **VÉRIFICATION**

Après avoir appliqué les deux migrations :

### **1. Tester les Propositions**
- Aller sur un projet en tant que professionnel
- Cliquer sur "Soumettre une proposition"
- Remplir le formulaire et envoyer
- ✅ La proposition devrait s'envoyer sans erreur
- ✅ Le client devrait recevoir une notification

### **2. Tester les Notifications**
- Ouvrir la console du navigateur (F12)
- Rafraîchir la page
- ✅ L'erreur 400 sur `/rest/v1/notifications` devrait disparaître
- ✅ La cloche de notification devrait fonctionner

---

## 🔍 **CE QUI A ÉTÉ CORRIGÉ**

### **Migration 020 : Propositions**
- ❌ **Avant** : Policy avec `EXISTS (SELECT ... WHERE user_type = 'professional')`
- ✅ **Après** : Policy simple `auth.uid() = professional_id`

### **Migration 021 : Notifications**
- ❌ **Avant** : Policy restrictive qui bloquait l'insertion par d'autres utilisateurs
- ✅ **Après** : Policy permettant à tout utilisateur authentifié d'insérer des notifications

---

## 📝 **NOTES IMPORTANTES**

- Les deux migrations sont **idempotentes** (peuvent être exécutées plusieurs fois sans erreur)
- Elles utilisent `DROP POLICY IF EXISTS` pour nettoyer les anciennes policies
- Les nouvelles policies sont plus simples et plus permissives pour les cas d'usage métier

---

## ❓ **EN CAS DE PROBLÈME**

Si vous rencontrez une erreur lors de l'application :
1. Copiez-collez l'erreur complète
2. Indiquez quelle migration (020 ou 021) a échoué
3. Je vous aiderai à corriger immédiatement

---

**Bon courage ! 🚀**









