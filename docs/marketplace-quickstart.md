# Démarrage Rapide — Marketplace des Professionnels

## Accéder à la marketplace

### URL
`http://localhost:8080/professionals`

### Navigation
1. Cliquez sur "Trouver un professionnel" dans la barre de navigation
2. Ou depuis la page d'accueil, boutons "Trouver un entrepreneur" ou "Devenir partenaire"

## Configuration requise

### 1. Appliquer la migration SQL

Dans Supabase > SQL Editor, exécutez :

```sql
-- Copier et exécuter le contenu de :
supabase/migrations/002_add_marketplace_fields.sql
```

Cette migration ajoute :
- Champs de localisation (city, region)
- Métriques (average_rating, total_reviews, total_projects)
- Table `reviews` pour les évaluations
- Table `portfolio_items` pour les portfolios
- Triggers automatiques pour les notes

### 2. Vérifier les données

Pour tester la marketplace, assurez-vous d'avoir des profils professionnels :

```sql
-- Vérifier les professionnels
SELECT id, company_name, is_rbq_verified, average_rating, total_reviews
FROM profiles
WHERE user_type = 'professional';

-- Ajouter le badge approuvé (optionnel)
UPDATE profiles
SET is_rbq_verified = TRUE
WHERE id = 'uuid-du-professionnel';
```

### 3. Ajouter des données de test (optionnel)

```sql
-- Mettre à jour un professionnel avec des données marketplace
UPDATE profiles
SET 
  city = 'Montréal',
  region = 'Québec',
  years_experience = 15,
  bio = 'Expert en rénovation résidentielle avec plus de 15 ans d''expérience.',
  average_rating = 4.8,
  total_reviews = 24,
  total_projects = 156
WHERE id = 'uuid-du-professionnel';
```

## Fonctionnalités disponibles

### ✅ Recherche
- Tapez dans la barre de recherche
- Recherche en temps réel par nom, entreprise ou service

### ✅ Filtres
- **Type de service** : Sélectionnez un service spécifique
- **Région** : Filtrez par ville/région
- **Trier par** : Récents, Nom (A-Z), ou Meilleures notes

### ✅ Cartes professionnels
Chaque carte affiche :
- Nom de l'entreprise + badge vérifié
- Numéro RBQ
- Localisation
- Années d'expérience
- Services offerts (badges)
- Note moyenne avec étoiles
- Nombre d'avis
- Nombre de projets réalisés

### ✅ Actions
- **Voir le profil** : (à implémenter)
- **Téléphone** : Contact rapide
- **Email** : Envoi d'email

## Test rapide

1. **Créer un professionnel de test** :
   - Allez sur `/auth?mode=signup`
   - Sélectionnez "Professionnel"
   - Remplissez le formulaire; la certification RBQ est optionnelle
   - Inscrivez-vous

2. **Compléter les données d'affichage du professionnel** :
   ```sql
   UPDATE profiles
   SET 
     city = 'Montréal',
     region = 'Montréal',
     years_experience = 10,
     average_rating = 4.5,
     total_reviews = 10,
     total_projects = 50
   WHERE email = 'votre-email@example.com';
   ```

3. **Visiter la marketplace** :
   - Allez sur `/professionals`
   - Votre professionnel devrait apparaître !

## Problèmes courants

### Aucun professionnel affiché
**Cause** : Aucun profil professionnel n'est disponible

**Solution** :
```sql
SELECT id, company_name, is_rbq_verified
FROM profiles
WHERE user_type = 'professional';

-- Vérifier la présence du profil
SELECT id, company_name FROM profiles WHERE id = 'uuid' AND user_type = 'professional';
```

### Notes à 0.0
**Cause** : Aucun avis pour ce professionnel

**Solution** : Ajouter des données de test :
```sql
UPDATE profiles
SET 
  average_rating = 4.5,
  total_reviews = 10
WHERE id = 'uuid-professionnel';
```

### Filtres ne fonctionnent pas
**Cause** : Champs `city`, `region`, `services_offered` vides

**Solution** : Ajouter ces informations :
```sql
UPDATE profiles
SET 
  city = 'Montréal',
  region = 'Montréal',
  services_offered = 'Rénovation résidentielle, Toiture, Peinture'
WHERE id = 'uuid-professionnel';
```

## Prochaines étapes

### À court terme
1. Créer la page de profil détaillé (`/professional/:id`)
2. Implémenter les boutons téléphone/email
3. Ajouter plus de professionnels de test

### À moyen terme
1. Ajouter la pagination
2. Implémenter le système d'avis complet
3. Créer le formulaire de demande de devis

## Documentation complète

Pour plus de détails, consultez :
- **Documentation marketplace** : `docs/marketplace.md`
- **Configuration Supabase** : `supabase/README.md`
- **Guide de test** : `docs/testing-guide.md`

## Support

Besoin d'aide ?
1. Vérifiez que la migration 002 est appliquée
2. Vérifiez qu'au moins un profil avec `user_type = 'professional'` existe
3. Consultez la console navigateur pour les erreurs
4. Vérifiez les logs Supabase pour les erreurs de requêtes
