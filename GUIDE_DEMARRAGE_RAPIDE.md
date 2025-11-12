# 🚀 Guide de Démarrage Rapide - Appels d'Offres Professionnels

## ✅ Ce qui a été créé

Vous disposez maintenant d'un système complet d'appels d'offres professionnels québécois avec export PDF.

---

## 📋 Étape 1 : Appliquer la migration SQL

### Dans Supabase Dashboard :

1. **Ouvrez** : [Supabase Dashboard](https://supabase.com/dashboard) → Votre projet → SQL Editor

2. **Copiez** le contenu du fichier : `supabase/migrations/025_professional_tender_format.sql`

3. **Collez** dans l'éditeur SQL

4. **Exécutez** (bouton RUN en bas à droite)

5. **Vérifiez** les messages de succès :
   ```
   ✅ Professional tender fields added to projects
   ✅ Professional fields added to proposals
   ✅ Tender/Proposal number generation functions created
   📄 Tender numbers: AO-YYYY-####
   📋 Proposal numbers: SOUM-YYYY-####
   ```

---

## 🎯 Étape 2 : Tester le système

### A. En tant que CLIENT

#### 1. Créer un projet
```
Dashboard → "Nouveau projet" → Remplir le formulaire → Soumettre
```

Le projet reçoit automatiquement un numéro d'appel d'offres : **AO-2024-0001**

#### 2. Voir l'appel d'offres en PDF
```
Dashboard → Mes projets → Clic sur ⋮ (menu) → "Voir l'appel d'offres (PDF)"
```

**OU**

```
URL directe : /tender/[project-id]
```

Vous verrez :
- ✅ Prévisualisation PDF en temps réel
- ✅ Bouton "Télécharger PDF" (nom: `Appel_Offres_AO-2024-0001.pdf`)
- ✅ Affichage structuré de toutes les informations
- ✅ PDF professionnel de 3 pages

#### 3. Consulter les soumissions reçues
```
Dashboard → Propositions reçues → Clic sur une proposition
```

**OU**

```
URL directe : /proposal/[proposal-id]
```

Vous verrez :
- ✅ Tous les détails de la soumission
- ✅ Prix, délai, équipe, calendrier, références
- ✅ Prévisualisation et téléchargement PDF
- ✅ **Boutons "Accepter" et "Refuser"** (si statut = pending)

### B. En tant que PROFESSIONNEL

#### 1. Consulter un projet
```
Marketplace (/projects) → Clic sur un projet intéressant
```

#### 2. Soumettre une proposition professionnelle

Sur la page du projet :
- ✅ **Nouvelle card verte** avec avantages mis en évidence
- ✅ Clic sur "Créer ma soumission professionnelle"

**Formulaire en 5 onglets** :

1. **📄 Base** : Message, description, méthodologie, budget, durée, RBQ, garantie
2. **👥 Équipe** : Ajout dynamique de membres (nom, rôle, expérience)
3. **📅 Calendrier** : Phases du projet avec durées et dates
4. **💰 Budget** : Décomposition détaillée par poste (calcul auto du total)
5. **🛡️ Extras** : Références de projets similaires avec contacts

**Remplissez** les sections désirées → **"Envoyer la soumission"**

La soumission reçoit automatiquement un numéro : **SOUM-2024-0001**

#### 3. Consulter mes soumissions
```
Pro Dashboard → Mes propositions → Clic sur une soumission
```

**OU**

```
URL directe : /proposal/[proposal-id]
```

Vous verrez :
- ✅ Votre soumission avec tous les détails
- ✅ Statut (Pending, Accepted, Rejected)
- ✅ Prévisualisation et téléchargement PDF
- ✅ PDF professionnel de 3 pages (format québécois)

---

## 📄 Format des PDFs

### Appel d'offres (Tender) - 3 pages

**Page 1** : Page de garde
- Numéro AO-YYYY-####
- Donneur d'ouvrage (client)
- Description du projet
- Budget, lieu, dates
- **Encadré orange** : Dates importantes

**Page 2** : Spécifications
- Spécifications techniques (liste)
- Jalons du projet (tableau)
- Exigences d'assurance et RBQ
- Critères d'évaluation (tableau)

**Page 3** : Modalités
- Documents requis (6 points)
- Mode de transmission
- Conditions de paiement
- Garanties
- Conditions générales (5 points)
- **Encadré orange** : Personne-ressource

**Couleurs** : Bleu (#2563eb, #1e40af)

### Soumission (Proposal) - 3 pages

**Page 1** : Présentation
- Numéro SOUM-YYYY-####
- **Encadré vert** : Soumissionnaire (professionnel)
- Destinataire (client)
- Portée des travaux
- Méthodologie

**Page 2** : Détails
- Équipe (tableau)
- Calendrier détaillé (tableau)
- Décomposition budgétaire (tableau)
- **Encadré vert** : Prix total en gros
- Équipement

**Page 3** : Garanties
- Garanties offertes (12 mois par défaut)
- Assurances et licence RBQ
- Références (cartes)
- Conditions générales (5 points)
- Section signature

**Couleurs** : Vert (#16a34a, #15803d)

---

## 🔗 Liens rapides

### Routes créées

| Route | Description | Accès |
|-------|-------------|-------|
| `/tender/:id` | Visualiser appel d'offres + PDF | Client, Pro, Public |
| `/proposal/:id` | Visualiser soumission + PDF | Client concerné, Pro concerné |
| `/project/:id` | Page projet (avec formulaire pro) | Tous |

### Boutons ajoutés

**Dans Dashboard Client** (`/dashboard`) :
- Mes projets → Menu ⋮ → **"Voir l'appel d'offres (PDF)"**

**Dans Page Projet** (`/project/:id`) :
- Pour les professionnels → **Card verte** → **"Créer ma soumission professionnelle"**

---

## 🎨 Expérience utilisateur

### Pour les clients

**Avant** (simple) :
- Formulaire basique de projet
- Propositions simples (message + budget + délai)

**Maintenant** (professionnel) :
- ✅ Appel d'offres complet en PDF de 3 pages
- ✅ Visualisation professionnelle
- ✅ Téléchargement PDF officiel
- ✅ Numérotation automatique (AO-YYYY-####)
- ✅ Partage facile (lien `/tender/:id`)

### Pour les professionnels

**Avant** (simple) :
- Formulaire 3 champs (message, budget, délai)

**Maintenant** (professionnel) :
- ✅ Formulaire en 5 onglets avec 20+ champs
- ✅ Sections dynamiques (équipe, calendrier, budget, références)
- ✅ Décomposition budgétaire détaillée
- ✅ PDF professionnel de 3 pages
- ✅ Numérotation automatique (SOUM-YYYY-####)
- ✅ Conforme aux standards québécois

---

## 🛠️ Fonctionnalités techniques

### Champs ajoutés aux projets (17)
- `tender_number` (auto-généré)
- `project_type`
- `work_description_detailed`
- `technical_specifications` (JSONB array)
- `work_schedule` (JSONB)
- `milestones` (JSONB array)
- `insurance_requirements` (JSONB)
- `licensing_requirements` (JSONB)
- `evaluation_criteria` (JSONB)
- `submission_deadline`
- `site_visit_date`
- `questions_deadline`
- `project_start_date`
- `project_end_date`
- `warranty_period_months`
- `payment_terms` (JSONB)
- `documents_urls` (JSONB array)

### Champs ajoutés aux proposals (13)
- `proposal_number` (auto-généré)
- `detailed_description`
- `work_methodology`
- `team_composition` (JSONB array)
- `equipment_list` (JSONB array)
- `budget_breakdown` (JSONB)
- `timeline_details` (JSONB array)
- `insurance_proof_url`
- `rbq_license_number`
- `"references"` (JSONB array)
- `warranty_offered_months`
- `payment_terms_accepted`
- `additional_documents` (JSONB array)
- `valid_until` (auto-calculé: +90 jours)

### Vues SQL créées (2)
- `tenders_complete` : Projet + Client
- `proposals_complete` : Soumission + Projet + Client + Professionnel

### Fonctions PostgreSQL créées (4)
- `generate_tender_number()` : Génère AO-YYYY-####
- `generate_proposal_number()` : Génère SOUM-YYYY-####
- `set_tender_number()` : Trigger pour auto-génération
- `set_proposal_number()` : Trigger pour auto-génération

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- **`APPELS_OFFRES_PROFESSIONNELS.md`** : Documentation complète (100+ sections)
  - Formats JSON des champs JSONB
  - Workflow complet client/professionnel
  - Prochaines étapes recommandées
  - Standards québécois
  - Exemples de code

---

## 🔄 Prochaines étapes recommandées

### 1. Mise à jour du formulaire NewProject.tsx
**Priorité** : Moyenne  
**Effort** : 2-3 heures

Ajouter des sections pour saisir :
- Spécifications techniques
- Jalons du projet
- Exigences d'assurance
- Licences RBQ requises
- Critères d'évaluation
- Dates importantes

Pour l'instant, ces champs sont NULL et le PDF utilise des valeurs par défaut.

### 2. Ajouter liens dans les notifications
**Priorité** : Haute  
**Effort** : 30 minutes

Dans les notifications :
- "Nouvelle proposition reçue" → Lien direct vers `/proposal/:id`
- "Proposition acceptée" → Lien direct vers `/proposal/:id`

### 3. Système de comparaison de propositions
**Priorité** : Basse  
**Effort** : 3-4 heures

Page `/project/:id/compare-proposals` pour comparer plusieurs soumissions côte à côte.

### 4. Emails automatiques avec PDFs
**Priorité** : Moyenne  
**Effort** : 2-3 heures

Intégrer Resend/SendGrid pour envoyer :
- L'appel d'offres en PDF aux professionnels
- La soumission en PDF au client
- Confirmation d'acceptation

---

## ✅ Checklist de vérification

### Migration SQL
- [ ] Copié et exécuté `025_professional_tender_format.sql` dans Supabase
- [ ] Vu les messages de succès (✅ checkmarks)
- [ ] Vérifié que les tables ont les nouvelles colonnes

### Tests Client
- [ ] Créé un nouveau projet
- [ ] Projet a reçu un numéro AO-YYYY-####
- [ ] Bouton "Voir l'appel d'offres (PDF)" visible dans Dashboard
- [ ] Prévisualisation PDF fonctionne
- [ ] Téléchargement PDF fonctionne

### Tests Professionnel
- [ ] Ouvert un projet
- [ ] Card verte "Créer ma soumission professionnelle" visible
- [ ] Formulaire en 5 onglets s'ouvre
- [ ] Soumission envoyée avec succès
- [ ] Soumission a reçu un numéro SOUM-YYYY-####
- [ ] PDF de la soumission accessible

### Tests Acceptation/Rejet
- [ ] Client peut voir les soumissions reçues
- [ ] Boutons "Accepter" et "Refuser" visibles (si pending)
- [ ] Acceptation change le statut à "accepted"
- [ ] Rejet change le statut à "rejected"

---

## 🆘 Problèmes courants

### La migration échoue
**Erreur possible** : `column already exists`  
**Solution** : Certaines colonnes existent peut-être déjà. Commentez les lignes `ADD COLUMN` problématiques.

### Les PDFs ne se génèrent pas
**Erreur possible** : `@react-pdf/renderer` non installé  
**Solution** :
```bash
npm install @react-pdf/renderer
```

### Les numéros ne se génèrent pas
**Vérifiez** : Les triggers sont bien créés
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%tender%' OR tgname LIKE '%proposal%';
```

### Les vues ne retournent pas de données
**Vérifiez** : Les vues existent
```sql
SELECT * FROM tenders_complete LIMIT 1;
SELECT * FROM proposals_complete LIMIT 1;
```

---

## 📞 Support

Pour toute question ou problème :
1. Consultez `APPELS_OFFRES_PROFESSIONNELS.md` (documentation complète)
2. Vérifiez les erreurs dans la console (F12)
3. Vérifiez les logs Supabase (Dashboard → Logs)

---

## 🎉 Félicitations !

Vous disposez maintenant d'un système professionnel d'appels d'offres québécois !

**Créé le** : 12 novembre 2024  
**Version** : 1.0.0  
**Commits** : 4 (corrigés et intégrés)  
**Fichiers** : 12 nouveaux, 3 modifiés  
**Lignes de code** : ~3500+

---

**Bonne utilisation ! 🚀**

