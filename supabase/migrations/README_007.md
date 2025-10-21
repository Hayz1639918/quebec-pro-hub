# Migration 007: Messagerie et Notifications

## 📋 Description

Cette migration ajoute un système complet de messagerie et de notifications en temps réel avec :
- **Conversations 1-à-1** entre clients et professionnels
- **Messages** avec statut de lecture
- **Notifications** avec plusieurs types d'événements
- **Supabase Realtime** pour les mises à jour instantanées
- **Row Level Security (RLS)** pour la sécurité
- **Fonctions RPC** pour faciliter les opérations

## 🗃️ Tables créées

1. **`conversations`**
   - Stocke les conversations entre deux utilisateurs
   - Contrainte unique pour éviter les doublons
   - Métadonnées : dernier message, timestamp

2. **`messages`**
   - Messages individuels dans les conversations
   - Statut de lecture (is_read, read_at)
   - Support des pièces jointes (optionnel)
   - Liens vers projets/propositions (optionnel)

3. **`notifications`**
   - Notifications pour tous les types d'événements
   - 10 types différents (nouveau message, soumission, etc.)
   - Métadonnées JSON pour données supplémentaires
   - Liens vers entités reliées

## 🔒 Sécurité (RLS)

Toutes les tables ont RLS activé avec des policies :
- Les utilisateurs ne voient que leurs propres conversations/messages
- Les utilisateurs ne peuvent envoyer des messages qu'en leur nom
- Les notifications sont privées à chaque utilisateur

## 🛠️ Fonctions RPC créées

| Fonction | Description |
|----------|-------------|
| `get_or_create_conversation(user_1_id, user_2_id)` | Récupère ou crée une conversation |
| `mark_message_as_read(message_id)` | Marque un message comme lu |
| `mark_conversation_as_read(conv_id)` | Marque tous les messages d'une conversation comme lus |
| `get_unread_messages_count(user_uuid)` | Compte les messages non lus |
| `get_unread_notifications_count(user_uuid)` | Compte les notifications non lues |

## 📊 Vues créées

- **`conversations_with_details`** : Conversations avec détails des participants

## ⚙️ Triggers automatiques

1. **`trigger_update_conversation_on_message`**
   - Met à jour le timestamp de la conversation quand un message est envoyé
   - Met à jour l'aperçu du dernier message

2. **`trigger_create_notification_on_message`**
   - Crée automatiquement une notification quand un message est reçu

## 🚀 Comment appliquer cette migration

### Via Supabase Dashboard (Recommandé)

1. Ouvrir [app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (menu de gauche)
4. Cliquer sur **New query**
5. Copier-coller le contenu de `007_add_messaging_and_notifications.sql`
6. Cliquer sur **Run** (ou Ctrl+Enter)
7. Vérifier qu'il n'y a pas d'erreur

### Via Supabase CLI

```bash
# Si vous avez configuré la CLI avec un token
npx supabase db push
```

## ✅ Vérification

Après l'application, vérifier que les tables existent :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'notifications');
```

Devrait retourner 3 lignes.

## 🔗 Intégration frontend

Les composants suivants ont été créés/mis à jour :
- ✅ `src/components/NotificationBell.tsx` - Cloche de notifications
- ✅ `src/components/messaging/MessagesList.tsx` - Liste des conversations
- ✅ `src/components/messaging/ChatWindow.tsx` - Fenêtre de chat
- ✅ `src/pages/Messages.tsx` - Page principale de messagerie
- ✅ `src/components/Navigation.tsx` - Ajout icônes notifications et messages
- ✅ `src/pages/Professionals.tsx` - Bouton "Contacter"
- ✅ `src/types/messaging.ts` - Types TypeScript
- ✅ Traductions FR/EN ajoutées

## 📱 Fonctionnalités disponibles après migration

### Pour les utilisateurs
1. ✉️ Envoyer/recevoir des messages en temps réel
2. 🔔 Recevoir des notifications pour tous les événements
3. ✓✓ Voir le statut de lecture des messages
4. 🔍 Rechercher dans les conversations
5. 📊 Voir le nombre de messages non lus

### Pour les développeurs
1. 🔄 Temps réel avec Supabase Realtime
2. 🔐 Sécurité avec RLS policies
3. 🎣 Triggers automatiques pour les notifications
4. 📡 Fonctions RPC pour opérations complexes
5. 🎨 UI complète avec shadcn/ui

## 🐛 Dépannage

### Erreur : "relation does not exist"
- Assurez-vous que les migrations 004, 005 et 006 sont appliquées avant celle-ci
- Vérifiez que la table `profiles` existe

### Erreur : "function does not exist"
- Relancez la migration complète
- Vérifiez les permissions de votre utilisateur Supabase

### Les notifications ne s'affichent pas
- Vérifiez que Supabase Realtime est activé pour votre projet
- Ouvrez la console du navigateur pour voir les erreurs

## 📚 Documentation

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

