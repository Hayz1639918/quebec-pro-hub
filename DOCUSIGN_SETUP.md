# 🖊️ Configuration DocuSign

## 📋 Vue d'ensemble

Cette application intègre **DocuSign** pour la signature électronique professionnelle des contrats. Deux modes sont disponibles :

1. **Mode Canvas** (par défaut) - Signature simple avec canvas HTML5
2. **Mode DocuSign** - Signature professionnelle avec DocuSign

## 🚀 Configuration rapide

### 1. Mode Demo (Recommandé pour les tests)

Le mode demo est activé par défaut et ne nécessite aucune configuration. Il simule l'intégration DocuSign.

### 2. Mode Production

Pour utiliser DocuSign en production, suivez ces étapes :

#### Étape 1 : Créer un compte DocuSign Developer

1. Aller sur [developers.docusign.com](https://developers.docusign.com/)
2. Créer un compte développeur
3. Créer une nouvelle application
4. Noter les informations suivantes :
   - **Integrator Key** (Client ID)
   - **User ID** (votre email)
   - **Account ID** (ID du compte)

#### Étape 2 : Générer une clé privée

1. Dans DocuSign Admin, aller dans **Apps and Keys**
2. Sélectionner votre application
3. Générer une paire de clés RSA
4. Télécharger la clé privée (.pem)

#### Étape 3 : Configurer l'application

Ajouter ces variables à votre fichier `.env` :

```env
# DocuSign Production
VITE_DOCUSIGN_BASE_PATH=https://na1.docusign.net/restapi
VITE_DOCUSIGN_INTEGRATOR_KEY=your_integrator_key
VITE_DOCUSIGN_USER_ID=your_user_id
VITE_DOCUSIGN_ACCOUNT_ID=your_account_id
VITE_DOCUSIGN_PRIVATE_KEY=your_private_key
VITE_DOCUSIGN_EXPIRES_IN=3600
VITE_DOCUSIGN_DEMO_MODE=false
```

## 🔧 Configuration dans l'interface

### Via l'interface utilisateur

1. Aller sur `/contracts`
2. Cliquer sur "Créer un contrat"
3. Dans l'onglet "Signature DocuSign"
4. Cliquer sur "Configurer DocuSign"
5. Remplir les informations :
   - **URL de base** : `https://demo.docusign.net/restapi` (demo) ou `https://na1.docusign.net/restapi` (prod)
   - **ID du compte** : Votre Account ID
   - **Clé d'intégration** : Votre Integrator Key
   - **ID utilisateur** : Votre User ID
   - **Clé privée** : Votre clé privée RSA

### Configuration avancée

- **Expiration** : Durée de validité du token (défaut : 3600 secondes)
- **Mode démo** : Active/désactive le mode test

## 🧪 Test de l'intégration

### 1. Test en mode Demo

1. Aller sur `/contracts`
2. Créer un nouveau contrat
3. Cliquer sur "Signer le contrat"
4. Sélectionner l'onglet "Signature DocuSign"
5. Cliquer sur "Charger la démo"
6. Cliquer sur "Sauvegarder"
7. Tester l'envoi du contrat

### 2. Test en mode Production

1. Configurer DocuSign avec vos vraies clés
2. Créer un contrat de test
3. Envoyer pour signature
4. Vérifier la réception des emails DocuSign
5. Tester la signature via l'URL fournie

## 📧 Webhooks DocuSign

### Configuration des webhooks

1. Dans DocuSign Admin, aller dans **Connect**
2. Créer un nouveau connecteur
3. URL du webhook : `https://votre-domaine.com/api/docusign/webhook`
4. Événements à écouter :
   - Envelope Sent
   - Envelope Delivered
   - Envelope Completed
   - Envelope Declined
   - Envelope Voided

### Implémentation du webhook

```typescript
// api/docusign/webhook.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // Vérifier la signature DocuSign
  // Traiter l'événement
  // Mettre à jour le statut du contrat
  
  return new Response('OK', { status: 200 });
}
```

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais exposer les clés privées** dans le code client
2. **Utiliser des variables d'environnement** pour la configuration
3. **Valider les webhooks** avec la signature DocuSign
4. **Chiffrer les données sensibles** en base de données
5. **Utiliser HTTPS** en production

### Variables sensibles

- `VITE_DOCUSIGN_INTEGRATOR_KEY` - Clé publique (OK en client)
- `VITE_DOCUSIGN_PRIVATE_KEY` - Clé privée (⚠️ Sensible)
- `VITE_DOCUSIGN_USER_ID` - Email utilisateur (OK en client)
- `VITE_DOCUSIGN_ACCOUNT_ID` - ID du compte (OK en client)

## 🐛 Dépannage

### Erreurs courantes

#### "DocuSign not initialized"
- Vérifier que la configuration est sauvegardée
- Vérifier les variables d'environnement

#### "Invalid credentials"
- Vérifier l'Integrator Key
- Vérifier le User ID
- Vérifier la clé privée

#### "Account not found"
- Vérifier l'Account ID
- Vérifier que le compte est actif

#### "Envelope not found"
- Vérifier l'Envelope ID
- Vérifier les permissions

### Logs de débogage

Activer les logs dans la console du navigateur :

```typescript
// Dans src/services/docusign.ts
console.log('DocuSign config:', config);
console.log('DocuSign response:', response);
```

## 📚 Ressources

- [DocuSign Developer Center](https://developers.docusign.com/)
- [DocuSign eSignature API](https://developers.docusign.com/docs/esign-rest-api/)
- [DocuSign JWT Authentication](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/jwt/jwt/)
- [DocuSign Webhooks](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/webhooks/)

## 🎯 Fonctionnalités implémentées

### ✅ Fonctionnalités de base
- Configuration DocuSign via interface
- Envoi de contrats pour signature
- Récupération des URLs de signature
- Gestion des statuts d'enveloppe
- Mode démo intégré

### ✅ Interface utilisateur
- Composant de configuration DocuSign
- Onglets Canvas/DocuSign dans la signature
- Gestion des erreurs et états de chargement
- Traductions FR/EN complètes

### 🔄 À implémenter
- Webhooks pour notifications automatiques
- Téléchargement des documents signés
- Gestion des amendements
- Intégration avec les notifications existantes
- Tests automatisés

## 🚀 Prochaines étapes

1. **Implémenter les webhooks** pour les notifications automatiques
2. **Ajouter le téléchargement** des documents signés
3. **Intégrer avec les notifications** existantes
4. **Ajouter des tests** automatisés
5. **Optimiser la gestion d'erreurs** et la récupération
