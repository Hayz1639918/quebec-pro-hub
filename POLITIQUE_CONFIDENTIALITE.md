# Politique de Confidentialité - BâtirNet

**Date d'entrée en vigueur:** 2025-11-03
**Dernière mise à jour:** 2025-11-03
**Version:** 1.0

---

## 📋 Introduction

BâtirNet (ci-après "nous", "notre", "BâtirNet") exploite la plateforme web accessible à l'adresse [batirnet.ca] (ci-après la "Plateforme"). Cette Politique de Confidentialité décrit comment nous recueillons, utilisons, divulguons et protégeons vos renseignements personnels conformément à la **Loi 25** (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) et à la **Loi sur la protection des renseignements personnels dans le secteur privé (LPRPSP)** du Québec.

En utilisant notre Plateforme, vous consentez aux pratiques décrites dans cette politique.

---

## 👤 Responsable de la Protection des Renseignements Personnels

Conformément à l'article 3.2 de la Loi 25, nous avons désigné un responsable de la protection des renseignements personnels:

**Nom:** [À DÉFINIR]
**Titre:** Responsable de la Protection des Renseignements Personnels
**Email:** privacy@batirnet.ca
**Téléphone:** [À DÉFINIR]
**Adresse:** [À DÉFINIR]

Vous pouvez contacter notre responsable pour toute question concernant cette politique ou l'exercice de vos droits.

---

## 📝 1. Renseignements Personnels Collectés

### 1.1 Informations de Compte

Lorsque vous créez un compte sur BâtirNet, nous recueillons:

**Pour tous les utilisateurs:**
- Nom complet
- Adresse courriel
- Numéro de téléphone
- Ville, province, code postal
- Mot de passe (chiffré avec bcrypt, jamais stocké en clair)
- Type d'utilisateur (client ou professionnel)
- Photo de profil (optionnelle)

**Pour les professionnels:**
- Nom de l'entreprise
- Numéro de licence RBQ (Régie du bâtiment du Québec)
- Spécialités et services offerts
- Informations d'assurance responsabilité
- Années d'expérience
- Taux horaires

**Finalité:** Création et gestion de votre compte, authentification, fourniture des services de la Plateforme.

**Fondement juridique:** Exécution du contrat (article 12 LPRPSP).

### 1.2 Informations d'Utilisation

Nous collectons automatiquement:

- **Données de connexion:** Adresse IP, User-Agent (navigateur), horodatage
- **Données de navigation:** Pages visitées, durée de session, actions effectuées
- **Données de géolocalisation:** Latitude et longitude (uniquement pour les signatures de contrats électroniques)

**Finalité:** Sécurité de la Plateforme, détection de fraude, audit trail des signatures électroniques, amélioration de l'expérience utilisateur.

**Fondement juridique:** Intérêt légitime (sécurité) + consentement (géolocalisation).

### 1.3 Informations de Projet et Contrat

- Descriptions de projets de construction/rénovation
- Budgets et délais
- Messages échangés entre clients et professionnels
- Propositions de contrats
- Contrats signés électroniquement
- Reviews et évaluations

**Finalité:** Mise en relation clients-professionnels, gestion de projets, exécution de contrats.

**Fondement juridique:** Exécution du contrat.

### 1.4 Informations de Paiement

⚠️ **À DÉFINIR** si intégration Stripe/autre processeur de paiement.

**Note:** Nous ne stockons JAMAIS les numéros de cartes de crédit complets. Les paiements sont traités par des processeurs tiers certifiés PCI-DSS.

---

## 🎯 2. Utilisation des Renseignements Personnels

### 2.1 Finalités Principales

Nous utilisons vos renseignements personnels pour:

1. **Fournir les services de la Plateforme:**
   - Créer et gérer votre compte
   - Mettre en relation clients et professionnels
   - Faciliter la communication (messagerie)
   - Gérer les propositions et contrats
   - Générer des signatures électroniques

2. **Assurer la sécurité:**
   - Authentifier votre identité
   - Prévenir la fraude et les abus
   - Maintenir un audit trail des actions critiques (signatures)

3. **Améliorer nos services:**
   - Analyser l'utilisation de la Plateforme
   - Développer de nouvelles fonctionnalités
   - Corriger les bugs et problèmes techniques

4. **Communiquer avec vous:**
   - Envoyer des notifications sur vos projets/contrats
   - Répondre à vos questions (support)
   - Vous informer de changements aux Conditions d'Utilisation ou à cette Politique

### 2.2 Finalités Secondaires

Avec votre **consentement explicite**, nous pouvons utiliser vos renseignements pour:

- Envoyer des infolettres et communications marketing
- Réaliser des sondages de satisfaction
- Vous proposer des services ou professionnels pertinents

**Vous pouvez retirer votre consentement en tout temps** en nous contactant ou en cliquant sur "Se désabonner" dans nos courriels.

---

## 🔐 3. Protection et Sécurité

### 3.1 Mesures de Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos renseignements personnels contre:

- L'accès non autorisé
- La perte, le vol ou la modification
- La divulgation accidentelle ou illicite

**Mesures techniques:**
- ✅ Chiffrement TLS 1.2+ pour toutes les communications (HTTPS)
- ✅ Chiffrement au repos (AES-256) pour la base de données
- ✅ Hashing bcrypt pour les mots de passe (jamais en clair)
- ✅ Row-Level Security (RLS) au niveau de la base de données
- ✅ Authentification multi-facteurs (2FA) pour les comptes (optionnel)
- ✅ Audit trail pour les actions sensibles (signatures)
- ✅ Scans de sécurité automatisés (CodeQL, npm audit)

**Mesures organisationnelles:**
- Accès limité aux renseignements personnels (principe du moindre privilège)
- Formation du personnel sur la protection des données
- Procédures d'intervention en cas d'incident
- Revues de sécurité régulières

### 3.2 Localisation des Données

Vos renseignements personnels sont stockés sur des serveurs Supabase (PostgreSQL) situés dans:

**Région:** [À SPÉCIFIER - ex: Canada (ca-central-1) ou US-East]

**⚠️ Important:** Si les données sont stockées hors Québec/Canada, nous nous assurons que le niveau de protection est équivalent à celui offert par les lois québécoises.

### 3.3 Durée de Conservation

Nous conservons vos renseignements personnels uniquement aussi longtemps que nécessaire pour les finalités décrites:

| Type de Renseignement | Durée de Conservation | Justification |
|-----------------------|-----------------------|---------------|
| **Compte utilisateur actif** | Tant que le compte est actif | Fourniture des services |
| **Compte fermé** | 30 jours (puis anonymisation) | Permettre réactivation |
| **Contrats signés** | 7 ans après fin du contrat | Obligations légales (Code civil du Québec) |
| **Audit trail signatures** | 7 ans | Preuve légale |
| **Messages/communications** | 1 an après fermeture du projet | Archives métier |
| **Logs de sécurité (IP, User-Agent)** | 90 jours | Sécurité et détection de fraude |

Après expiration, vos données sont soit **supprimées**, soit **anonymisées** (retrait de tout identifiant personnel).

---

## 👥 4. Communication et Divulgation

### 4.1 Divulgation aux Autres Utilisateurs

Certains renseignements sont visibles par d'autres utilisateurs de la Plateforme:

**Profil public (professionnels):**
- Nom complet ou nom d'entreprise
- Ville et région
- Spécialités et services
- Numéro RBQ
- Photo de profil
- Portfolio, reviews, évaluations

**Projets publics (marketplace):**
- Titre et description du projet
- Ville et région
- Budget (fourchette)
- Statut du projet

**⚠️ Ne sont JAMAIS visibles publiquement:** Adresse complète, téléphone, email, messages privés.

### 4.2 Divulgation à des Tiers

Nous ne vendons, ne louons ni n'échangeons vos renseignements personnels à des tiers à des fins commerciales.

Nous pouvons divulguer vos renseignements dans les cas suivants:

**a) Fournisseurs de services (sous-traitants):**

Nous faisons appel à des fournisseurs de services de confiance pour nous aider à exploiter la Plateforme:

| Fournisseur | Service | Données Partagées | Localisation |
|-------------|---------|-------------------|--------------|
| **Supabase** | Hébergement base de données + Auth | Toutes données de compte | [Région AWS] |
| **[À DÉFINIR]** | Email transactionnel | Email, nom | [À DÉFINIR] |
| **[À DÉFINIR]** | Analytiques | Données anonymisées | [À DÉFINIR] |
| **[À DÉFINIR]** | Paiements | Données paiement | [À DÉFINIR] |

Ces fournisseurs sont contractuellement tenus de protéger vos renseignements et de les utiliser uniquement pour les fins pour lesquelles ils ont été divulgués.

**b) Obligations légales:**

Nous pouvons divulguer vos renseignements si requis par la loi, par exemple:
- En réponse à une assignation, une ordonnance de tribunal ou une demande gouvernementale légitime
- Pour protéger nos droits, notre propriété ou notre sécurité
- Pour enquêter sur une fraude ou une violation de nos Conditions d'Utilisation

**c) Transfert d'entreprise:**

En cas de fusion, acquisition ou vente d'actifs, vos renseignements personnels peuvent être transférés au nouvel acquéreur. Vous serez informé par courriel et/ou avis sur la Plateforme.

---

## 🍪 5. Cookies et Technologies de Suivi

### 5.1 Cookies Utilisés

Nous utilisons des cookies (petits fichiers texte stockés sur votre appareil) pour:

| Type de Cookie | Finalité | Durée | Consentement Requis? |
|----------------|----------|-------|----------------------|
| **Essentiels** | Authentification (JWT token) | 1 heure (+ refresh) | ❌ Non (nécessaire au service) |
| **Fonctionnels** | Préférences utilisateur (langue, thème) | 1 an | ❌ Non |
| **Analytiques** | Analyse d'utilisation (si implémenté) | Variable | ✅ Oui |
| **Marketing** | Publicité ciblée (non utilisé actuellement) | N/A | ✅ Oui |

**⚠️ IMPORTANT:** Actuellement, nous n'utilisons **que des cookies essentiels et fonctionnels**. Si nous implémentons des cookies analytiques ou marketing à l'avenir, nous demanderons votre consentement via une bannière de cookies.

### 5.2 Gestion des Cookies

Vous pouvez contrôler les cookies via les paramètres de votre navigateur:

- **Chrome:** Paramètres → Confidentialité et sécurité → Cookies
- **Firefox:** Paramètres → Vie privée et sécurité → Cookies
- **Safari:** Préférences → Confidentialité → Cookies

**⚠️ Note:** Bloquer les cookies essentiels empêchera le bon fonctionnement de la Plateforme.

---

## ✅ 6. Vos Droits (Loi 25)

Conformément à la Loi 25, vous disposez des droits suivants:

### 6.1 Droit d'Accès (Article 27)

Vous avez le droit de demander:
- Confirmation que nous détenons vos renseignements personnels
- Accès à vos renseignements
- Une copie de vos renseignements (format structuré, JSON ou PDF)

**Comment exercer:** Envoyez une demande à privacy@batirnet.ca avec votre nom complet et email de compte.

**Délai de réponse:** 30 jours maximum.

### 6.2 Droit de Rectification (Article 28)

Vous pouvez demander la correction de renseignements inexacts ou incomplets.

**Comment exercer:**
- Via votre profil utilisateur (édition directe)
- En nous contactant à privacy@batirnet.ca

### 6.3 Droit à la Suppression / Désindexation (Article 28.1)

Vous pouvez demander:
- La suppression de votre compte
- L'anonymisation de vos données
- La désindexation (retrait de certaines informations publiques)

**Comment exercer:** Envoyez une demande à privacy@batirnet.ca.

**⚠️ Exceptions:** Nous pouvons refuser la suppression si nous avons une obligation légale de conserver les données (ex: contrats signés - 7 ans).

### 6.4 Droit de Retirer le Consentement (Article 14)

Vous pouvez retirer votre consentement en tout temps pour:
- Les communications marketing (se désabonner)
- La géolocalisation (désactiver dans les paramètres)
- Les cookies analytiques (si implémentés)

**Comment exercer:** Cliquez sur "Se désabonner" dans nos emails ou contactez privacy@batirnet.ca.

### 6.5 Droit à la Portabilité (Article 48.1)

Vous pouvez demander une copie de vos renseignements dans un format structuré et couramment utilisé (JSON, CSV).

**Comment exercer:** Demande à privacy@batirnet.ca.

### 6.6 Droit de Déposer une Plainte

Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une plainte auprès de:

**Commission d'accès à l'information du Québec (CAI)**
- Site web: [https://www.cai.gouv.qc.ca](https://www.cai.gouv.qc.ca)
- Téléphone: 1-888-528-7741
- Adresse: 525, boulevard René-Lévesque Est, bureau 1.25, Québec (Québec) G1R 5S9

---

## 🔔 7. Avis d'Incident de Confidentialité

### 7.1 Notre Engagement

En cas d'incident de confidentialité présentant un **risque de préjudice sérieux**, nous nous engageons à:

1. **Aviser la CAI** dans les plus brefs délais
2. **Vous aviser individuellement** par courriel et/ou SMS
3. **Prendre des mesures pour atténuer les risques**

### 7.2 Registre d'Incidents

Conformément à l'article 63.5 de la Loi 25, nous maintenons un registre de tous les incidents de confidentialité incluant:
- Date et heure de l'incident
- Nature des renseignements compromis
- Personnes concernées
- Mesures prises pour remédier

Ce registre est conservé pendant **5 ans** et disponible pour inspection par la CAI.

### 7.3 Contenu de l'Avis

Si vous êtes affecté par un incident, notre avis incluera:
- La nature de l'incident
- Les renseignements personnels concernés
- Les mesures que nous avons prises
- Les mesures que vous pouvez prendre (ex: changer mot de passe)
- Notre contact pour questions

---

## 🌐 8. Transferts Internationaux

**Statut actuel:** [À COMPLÉTER selon l'hébergement Supabase]

Si vos données sont transférées hors du Québec/Canada, nous nous assurons que:
- Le pays offre un niveau de protection substantiellement similaire (ex: pays adéquats selon la CAI)
- OU des garanties contractuelles sont en place (clauses types de protection)

**Liste des transferts:**
| Destination | Fournisseur | Garantie |
|-------------|-------------|----------|
| [Ex: USA] | Supabase (AWS) | Clauses contractuelles types + certification SOC 2 |

---

## 👶 9. Mineurs

Notre Plateforme n'est **pas destinée aux personnes de moins de 18 ans**. Nous ne collectons pas sciemment de renseignements personnels d'enfants.

Si vous êtes parent/tuteur et découvrez que votre enfant nous a fourni des renseignements, contactez-nous immédiatement à privacy@batirnet.ca pour suppression.

---

## 📢 10. Modifications de cette Politique

Nous pouvons modifier cette Politique de Confidentialité de temps à autre pour refléter:
- Des changements à nos pratiques
- Des nouvelles exigences légales
- Des améliorations de nos services

**Avis de modification:**
- Les modifications importantes seront annoncées via un avis sur la Plateforme et/ou par courriel
- La nouvelle politique entrera en vigueur **30 jours** après l'avis
- La date de "Dernière mise à jour" sera modifiée en haut de ce document

**Votre utilisation continue de la Plateforme après l'entrée en vigueur constitue votre acceptation des modifications.**

Nous vous encourageons à consulter régulièrement cette politique.

---

## 📞 11. Nous Contacter

Pour toute question concernant cette Politique de Confidentialité ou l'exercice de vos droits:

**Responsable de la Protection des Renseignements Personnels:**
- Email: privacy@batirnet.ca
- Téléphone: [À DÉFINIR]
- Adresse postale: [À DÉFINIR]

**Support général:**
- Email: support@batirnet.ca

**Délai de réponse:** Nous nous efforçons de répondre dans les **48 heures** (jours ouvrables).

---

## 📚 12. Références Légales

Cette Politique de Confidentialité est conforme aux lois suivantes:

- **Loi 25** (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels, 2021)
- **Loi sur la protection des renseignements personnels dans le secteur privé (LPRPSP)** du Québec
- **Code civil du Québec** (conservation des contrats)

**Pour plus d'informations sur vos droits:**
- Commission d'accès à l'information (CAI): [https://www.cai.gouv.qc.ca](https://www.cai.gouv.qc.ca)
- Guide Loi 25: [https://www.cai.gouv.qc.ca/modernisation/](https://www.cai.gouv.qc.ca/modernisation/)

---

**Dernière mise à jour:** 2025-11-03
**Version:** 1.0

*Nous nous engageons à respecter votre vie privée et à protéger vos renseignements personnels conformément aux plus hauts standards de sécurité et aux lois québécoises.*
