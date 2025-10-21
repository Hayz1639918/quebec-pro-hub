# 🌱 Guide de Seed des Professionnels

## 🚀 Création rapide de professionnels de démonstration

### Étape 1: Obtenir votre clé de service Supabase

1. **Ouvrir** [app.supabase.com](https://app.supabase.com)
2. **Sélectionner** votre projet BâtirNet
3. **Aller dans** Settings → API
4. **Copier** la **"service_role"** key (pas la "anon" key)
5. **⚠️ ATTENTION** : Cette clé a des privilèges admin, gardez-la secrète !

### Étape 2: Exécuter le script

**Option A: Avec variable d'environnement (Recommandé)**

```bash
# Windows PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY="votre-cle-service-ici"
cd scripts
npm run seed:now

# Windows CMD
set SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-ici
cd scripts
npm run seed:now

# Linux/Mac
export SUPABASE_SERVICE_ROLE_KEY="votre-cle-service-ici"
cd scripts
npm run seed:now
```

**Option B: Script interactif**

```bash
cd scripts
npm run seed:interactive
# Suivez les instructions à l'écran
```

### Étape 3: Vérifier les résultats

1. **Aller sur** http://localhost:8081/professionals
2. **Vérifier** que 5 professionnels s'affichent
3. **Tester les fonctionnalités** :
   - ✅ Filtres (budget, disponibilité, temps de réponse)
   - ✅ Tri (proximité, activité, note, nom)
   - ✅ Bouton "Contacter" (💬)
   - ✅ Messagerie temps réel

## 📊 Professionnels créés

| Nom | Entreprise | Services | Ville | Taux/h | Disponibilité |
|-----|------------|----------|-------|--------|---------------|
| Jean Tremblay | Construction Tremblay Inc. | Construction générale | Montréal | 75-125$ | Disponible |
| Marie Leblanc | Électricité Leblanc | Électricité, Domotique | Laval | 65-95$ | Disponible |
| Pierre Gagnon | Plomberie Gagnon & Fils | Plomberie, HVAC | Longueuil | 60-90$ | Occupé |
| Luc Bélanger | Toitures Bélanger | Toiture | Brossard | 70-110$ | Disponible |
| Sophie Martin | Paysages Sophie Martin | Paysagement | Saint-Laurent | 55-85$ | Disponible |

## 🧪 Tests à effectuer

### 1. Filtres
- **Budget** : "50-75 $/h" → Devrait montrer Marie Leblanc
- **Disponibilité** : "Disponible" → Devrait montrer 4 pros
- **Temps de réponse** : "Moins de 12h" → Devrait montrer Marie et Sophie

### 2. Tri
- **Proximité** : Nécessite géolocalisation du navigateur
- **Activité** : Jean Tremblay devrait être en premier (score 92.5)
- **Note** : Marie Leblanc devrait être en premier (4.9/5)

### 3. Messagerie
- **Cliquer** sur 💬 d'un professionnel
- **Envoyer** un message
- **Vérifier** que la conversation s'ouvre

## 🔧 Dépannage

### Erreur "Invalid API key"
- Vérifiez que vous utilisez la **service_role** key, pas la **anon** key
- Vérifiez que la clé est correctement copiée

### Erreur "relation does not exist"
- Vérifiez que les migrations 004, 005, 006, 007 sont appliquées
- Allez dans Supabase Dashboard → SQL Editor et exécutez les migrations

### Erreur "duplicate key value"
- Un professionnel avec cet email existe déjà
- Le script continue avec les autres

### Aucun professionnel ne s'affiche
- Vérifiez que `is_rbq_verified = true` dans la base de données
- Vérifiez que `user_type = 'professional'`

## 🗑️ Nettoyage (si nécessaire)

Pour supprimer tous les professionnels créés :

```sql
-- Dans Supabase SQL Editor
DELETE FROM profiles WHERE user_type = 'professional';
-- Puis supprimez les utilisateurs dans Authentication > Users
```

## 📝 Personnalisation

Pour modifier les professionnels, éditez le tableau `professionals` dans `scripts/seed-now.js`.

Champs disponibles :
- `email`, `password`, `full_name`, `phone`
- `company_name`, `rbq_number`, `services_offered`
- `city`, `region`, `bio`, `years_experience`
- `hourly_rate_min/max`, `availability_status`
- `latitude`, `longitude`, `activity_score`
- Et bien d'autres...

---

**🎉 Une fois le seed terminé, vous aurez une plateforme complètement fonctionnelle avec des données réalistes !**
