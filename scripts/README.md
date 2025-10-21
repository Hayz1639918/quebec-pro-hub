# Scripts de Seed pour BâtirNet

Ce dossier contient des scripts pour peupler la base de données avec des données de démonstration.

## 🚀 Script de Seed des Professionnels

### Prérequis

1. **Variables d'environnement** : Créez un fichier `.env` dans le dossier `scripts/` avec :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Clé de service Supabase** : 
   - Allez dans Supabase Dashboard → Settings → API
   - Copiez la "service_role" key (pas la "anon" key)
   - ⚠️ **ATTENTION** : Cette clé a des privilèges admin, gardez-la secrète !

### Installation

```bash
cd scripts
npm install
```

### Exécution

```bash
npm run seed:professionals
```

## 📊 Données créées

Le script crée **10 professionnels** avec :

### Informations de base
- ✅ Email et mot de passe (tous: `Test123!`)
- ✅ Nom complet et nom d'entreprise
- ✅ Numéro RBQ unique
- ✅ Services offerts variés
- ✅ Informations d'assurance

### Données géographiques
- ✅ Ville et région du Québec
- ✅ Coordonnées GPS précises
- ✅ Distance de déplacement

### Métriques de performance
- ✅ Années d'expérience (10-28 ans)
- ✅ Note moyenne (4.6-4.9/5)
- ✅ Nombre d'avis et projets
- ✅ Score d'activité calculé

### Filtres et tri
- ✅ Taux horaire min/max
- ✅ Statut de disponibilité
- ✅ Temps de réponse
- ✅ Budget minimum de projet
- ✅ Accepte les petits projets

## 🎯 Professionnels créés

1. **Jean Tremblay** - Construction générale (Montréal)
2. **Marie Leblanc** - Électricité (Laval)
3. **Pierre Gagnon** - Plomberie (Longueuil)
4. **Luc Bélanger** - Toiture (Brossard)
5. **Sophie Martin** - Paysagement (Saint-Laurent)
6. **François Roy** - Menuiserie (Repentigny)
7. **Isabelle Côté** - Peinture (Terrebonne)
8. **Robert Tremblay** - Excavation (Laval)
9. **Caroline Bouchard** - Design intérieur (Montréal)
10. **Martin Lavoie** - HVAC (Boucherville)

## 🧪 Test après seed

1. **Aller sur** http://localhost:8081/professionals
2. **Vérifier** que les 10 cartes s'affichent
3. **Tester les filtres** :
   - Budget (6 fourchettes)
   - Disponibilité (3 statuts)
   - Temps de réponse (4 options)
4. **Tester les tris** :
   - Proximité (nécessite géolocalisation)
   - Activité (score 0-100)
   - Note, nom, récent
5. **Tester la messagerie** :
   - Cliquer sur 💬 pour contacter
   - Créer des conversations

## 🔧 Dépannage

### Erreur "Invalid API key"
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correcte
- Assurez-vous d'utiliser la "service_role" key, pas "anon"

### Erreur "relation does not exist"
- Vérifiez que les migrations 004, 005, 006, 007 sont appliquées
- Les tables `profiles`, `conversations`, `messages`, `notifications` doivent exister

### Erreur "duplicate key value"
- Un professionnel avec cet email existe déjà
- Le script continue avec les autres

### Erreur "permission denied"
- Vérifiez que la clé de service a les bonnes permissions
- Assurez-vous que RLS est configuré correctement

## 🗑️ Nettoyage

Pour supprimer tous les professionnels créés :

```sql
-- ATTENTION: Supprime TOUS les professionnels
DELETE FROM profiles WHERE user_type = 'professional';
-- Puis supprimez les utilisateurs dans Supabase Auth Dashboard
```

## 📝 Personnalisation

Pour modifier les professionnels, éditez le tableau `professionals` dans `seed-professionals.js`.

Champs disponibles :
- `email`, `password`, `full_name`, `phone`
- `company_name`, `rbq_number`, `services_offered`
- `city`, `region`, `bio`, `years_experience`
- `hourly_rate_min/max`, `availability_status`
- `latitude`, `longitude`, `activity_score`
- Et bien d'autres...
