# Migration 008: Système de Contrats et E-Signature

## 📋 Description

Cette migration ajoute un système complet de contrats électroniques avec :
- **Templates de contrats** prédéfinis
- **Gestion des contrats** avec statuts et versioning
- **E-signature** électronique
- **Amendements** de contrats
- **Notifications** automatiques
- **Row Level Security (RLS)** pour la sécurité

## 🗃️ Tables créées

1. **`contract_templates`**
   - Modèles de contrats prédéfinis
   - Contenu HTML avec variables
   - Catégories (construction, rénovation, maintenance, consultation)

2. **`contracts`**
   - Contrats individuels entre clients et professionnels
   - Statuts de signature (draft, pending, signed, etc.)
   - Données de signature électronique
   - Conditions financières et légales

3. **`contract_amendments`**
   - Modifications des contrats existants
   - Approbation par les deux parties

## 🔒 Sécurité (RLS)

Toutes les tables ont RLS activé avec des policies :
- Les utilisateurs ne voient que leurs propres contrats
- Les templates sont publics (lecture seule)
- Les amendements sont privés aux parties du contrat

## 🛠️ Fonctions RPC créées

| Fonction | Description |
|----------|-------------|
| `generate_contract_content(template_id, variables)` | Génère le contenu du contrat à partir d'un template |
| `is_contract_signed(contract_id)` | Vérifie si un contrat est entièrement signé |
| `get_contract_status(contract_id)` | Obtient le statut actuel d'un contrat |

## ⚙️ Triggers automatiques

1. **`trigger_update_contract_status`**
   - Met à jour le statut du contrat quand les signatures changent
   - Définit `signed_at` quand les deux parties ont signé

2. **`trigger_notify_contract_status_change`**
   - Crée des notifications quand le statut du contrat change
   - Notifie les deux parties

## 📊 Templates inclus

2 modèles de contrats prédéfinis :
- **Contrat de construction résidentielle** (complet)
- **Contrat de rénovation** (simplifié)

## 🚀 Comment appliquer cette migration

### Via Supabase Dashboard (Recommandé)

1. Ouvrir [app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (menu de gauche)
4. Cliquer sur **New query**
5. Copier-coller le contenu de `008_add_contracts_system.sql`
6. Cliquer sur **Run** (ou Ctrl+Enter)
7. Vérifier qu'il n'y a pas d'erreur

## ✅ Vérification

Après l'application, vérifier que les tables existent :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contract_templates', 'contracts', 'contract_amendments');
```

Devrait retourner 3 lignes.

## 🔗 Intégration frontend

Les composants suivants ont été créés :
- ✅ `src/components/contracts/ContractTemplates.tsx` - Bibliothèque de modèles
- ✅ `src/components/contracts/ContractViewer.tsx` - Affichage des contrats
- ✅ `src/components/contracts/ESignature.tsx` - Signature électronique
- ✅ `src/pages/Contracts.tsx` - Page principale des contrats
- ✅ `src/types/contracts.ts` - Types TypeScript
- ✅ Traductions FR/EN complètes
- ✅ Route `/contracts` ajoutée
- ✅ Icône contrats dans la navigation

## 📱 Fonctionnalités disponibles après migration

### Pour les utilisateurs
1. 📄 Voir la bibliothèque de modèles de contrats
2. ✍️ Créer des contrats à partir de modèles
3. 🔍 Rechercher et filtrer les contrats
4. 📊 Voir les statistiques des contrats
5. ✍️ Signer électroniquement les contrats
6. 📧 Recevoir des notifications de changement de statut

### Pour les développeurs
1. 🔄 Temps réel avec Supabase Realtime
2. 🔐 Sécurité avec RLS policies
3. 🎣 Triggers automatiques pour les notifications
4. 📡 Fonctions RPC pour opérations complexes
5. 🎨 UI complète avec shadcn/ui
6. 🌐 Support multilingue (FR/EN)

## 🧪 Tests à effectuer

1. **Aller sur** http://localhost:8081/contracts
2. **Vérifier** que la page s'affiche sans erreur
3. **Tester** l'onglet "Modèles de contrats"
4. **Tester** la signature électronique (simulée)
5. **Vérifier** que les notifications fonctionnent

## 🐛 Dépannage

### Erreur : "relation does not exist"
- Assurez-vous que les migrations 004, 005, 006, 007 sont appliquées avant celle-ci
- Vérifiez que la table `profiles` existe

### Erreur : "function does not exist"
- Relancez la migration complète
- Vérifiez les permissions de votre utilisateur Supabase

### Les contrats ne s'affichent pas
- Vérifiez que Supabase Realtime est activé pour votre projet
- Ouvrez la console du navigateur pour voir les erreurs

## 📚 Documentation

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

## 🎯 Prochaines étapes

1. **Appliquer la migration** via Supabase Dashboard
2. **Tester l'interface** des contrats
3. **Intégrer** les contrats dans le flux de projets
4. **Ajouter** la génération de PDF
5. **Implémenter** l'intégration avec des services d'e-signature externes
