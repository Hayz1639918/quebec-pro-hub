# 📅 Actions POST-MERGE COURT TERME (J+7 à J+30)

**Prérequis:** Actions URGENT (J+0-J+7) complétées ✅

---

## 🎯 Objectifs Court Terme

Après avoir sécurisé les vulnérabilités critiques et activé CI/CD, cette phase se concentre sur:

1. **Implémenter mécanismes Loi 25** (droits utilisateurs)
2. **Améliorer validation et sécurité** (server-side, rate limiting)
3. **Monitoring et alertes**
4. **Tests de sécurité**

---

## 🔐 Loi 25 - Droits des Utilisateurs

### ACTION 11: Endpoint Export Données User (API) - 4h

**Pourquoi:** Loi 25 Art. 27 - Droit d'accès (30 jours)

**Implémentation (Supabase Edge Function):**

```typescript
// supabase/functions/export-user-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Collect all user data
    const userData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      profile: null,
      projects: [],
      proposals: [],
      contracts: [],
      messages: [],
      notifications: [],
      reviews: []
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    userData.profile = profile

    // Fetch projects (as client)
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', user.id)
    userData.projects = projects

    // Fetch proposals (as professional)
    const { data: proposals } = await supabase
      .from('proposals')
      .select('*')
      .eq('professional_id', user.id)
    userData.proposals = proposals

    // Fetch contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
    userData.contracts = contracts

    // Fetch messages
    const { data: conversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    const conversationIds = conversations?.map(c => c.conversation_id) || []
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
    userData.messages = messages

    // Fetch notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
    userData.notifications = notifications

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .or(`reviewer_id.eq.${user.id},professional_id.eq.${user.id}`)
    userData.reviews = reviews

    // Return JSON
    return new Response(
      JSON.stringify(userData, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="batirnet-data-${user.id}.json"`
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

**Frontend (bouton dans profil):**
```tsx
// src/pages/Profile.tsx
const handleExportData = async () => {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    'https://gsnjnhxzacwjslirfxgy.supabase.co/functions/v1/export-user-data',
    {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    }
  )

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mes-donnees-batirnet-${new Date().toISOString()}.json`
  a.click()
}

// Button
<Button onClick={handleExportData}>
  Exporter mes données (JSON)
</Button>
```

**Déploiement:**
```bash
npx supabase functions deploy export-user-data
```

---

### ACTION 12: Fonction "Supprimer mon compte" - 6h

**Pourquoi:** Loi 25 Art. 29 - Droit à la suppression

**⚠️ IMPORTANT:** Garder données contractuelles 7 ans (Code civil QC)

**Implémentation (Supabase Edge Function):**

```typescript
// supabase/functions/delete-account/index.ts
serve(async (req) => {
  try {
    const supabase = createClient(...)
    const { data: { user } } = await supabase.auth.getUser(...)

    // 1. Anonymiser profile (garder pour audit/stats)
    await supabase
      .from('profiles')
      .update({
        full_name: `User-${user.id.slice(0, 8)}`,
        email: `deleted-${user.id.slice(0, 8)}@anonymized.local`,
        phone: null,
        address: null,
        city: null,
        province: null,
        postal_code: null,
        avatar_url: null,
        company_name: null,
        bio: null,
        deleted_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // 2. Supprimer données non-contractuelles
    await supabase.from('notifications').delete().eq('user_id', user.id)
    await supabase.from('favorites').delete().eq('user_id', user.id)

    // 3. Anonymiser messages
    await supabase
      .from('messages')
      .update({ content: '[Message supprimé]' })
      .eq('sender_id', user.id)

    // 4. GARDER contracts/proposals (obligation légale 7 ans)
    // → Déjà anonymisés via profile

    // 5. Supprimer compte Auth Supabase
    await supabase.auth.admin.deleteUser(user.id)

    return new Response(
      JSON.stringify({ success: true, message: 'Compte supprimé' }),
      { status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

**Frontend (page Settings):**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Supprimer mon compte</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
      <AlertDialogDescription>
        Cette action est irréversible. Vos données seront:
        - Profile: anonymisé
        - Messages: supprimés
        - Contrats: conservés 7 ans (obligation légale)

        Délai: traitement sous 30 jours.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={handleDeleteAccount}>
        Confirmer la suppression
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### ACTION 13: Formulaire Demandes d'Accès/Rectification - 3h

**Implémentation simple (form → email):**

```tsx
// src/pages/DemandeAcces.tsx
export default function DemandeAcces() {
  const [form, setForm] = useState({
    type: 'access', // 'access', 'rectification', 'deletion'
    nom: '',
    email: '',
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Envoyer email au Responsable RP
    const response = await fetch('/api/send-privacy-request', {
      method: 'POST',
      body: JSON.stringify(form)
    })

    toast.success('Demande envoyée. Réponse sous 30 jours.')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Demande d'accès à mes renseignements personnels</h1>

      <Select value={form.type} onChange={(v) => setForm({...form, type: v})}>
        <option value="access">Demande d'accès (Art. 27)</option>
        <option value="rectification">Demande de rectification (Art. 28)</option>
        <option value="deletion">Demande de suppression (Art. 29)</option>
      </Select>

      <Input
        label="Nom complet"
        value={form.nom}
        onChange={(e) => setForm({...form, nom: e.target.value})}
        required
      />

      <Input
        label="Email (compte BâtirNet)"
        type="email"
        value={form.email}
        onChange={(e) => setForm({...form, email: e.target.value})}
        required
      />

      <Textarea
        label="Description de votre demande"
        value={form.description}
        onChange={(e) => setForm({...form, description: e.target.value})}
      />

      <Button type="submit">Soumettre la demande</Button>

      <p className="text-sm text-gray-600">
        Délai de réponse: 30 jours maximum (Loi 25)
      </p>
    </form>
  )
}
```

---

## 🛡️ Sécurité Avancée

### ACTION 14: Rate Limiting (Supabase Edge Function) - 6h

**Pourquoi:** OWASP ASVS V11.1.4 - Prévention brute force

**Implémentation (middleware Edge Function):**

```typescript
// supabase/functions/_shared/rate-limit.ts
import { createClient } from '@supabase/supabase-js'

const RATE_LIMITS = {
  'auth.login': { window: 300, max: 5 }, // 5 tentatives / 5 min
  'api.create_project': { window: 3600, max: 10 }, // 10 projets / heure
  'api.send_message': { window: 60, max: 20 } // 20 messages / minute
}

export async function checkRateLimit(
  identifier: string, // IP ou user_id
  action: string
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient(...)
  const limit = RATE_LIMITS[action]
  const key = `ratelimit:${action}:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - limit.window

  // Compter les requêtes dans la fenêtre
  const { count } = await supabase
    .from('rate_limit_log')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('timestamp', windowStart)

  if (count >= limit.max) {
    return { allowed: false, remaining: 0 }
  }

  // Logger cette requête
  await supabase
    .from('rate_limit_log')
    .insert({ key, timestamp: now })

  return { allowed: true, remaining: limit.max - count - 1 }
}
```

**Table SQL:**
```sql
CREATE TABLE rate_limit_log (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rate_limit_key_timestamp ON rate_limit_log(key, timestamp);

-- Cleanup automatique (Cron Job)
-- Supprimer logs > 24h
DELETE FROM rate_limit_log WHERE created_at < now() - interval '24 hours';
```

---

### ACTION 15: Server-Side Validation (Zod) - 8h

**Pourquoi:** OWASP ASVS V5.1.1 - Validation stricte

**Implémentation (Edge Function middleware):**

```typescript
// supabase/functions/_shared/validation.ts
import { z } from 'zod'

export const ProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum([
    'construction',
    'renovation',
    'plumbing',
    'electricity',
    'landscaping'
  ]),
  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  city: z.string().min(2).max(100),
  province: z.enum(['QC', 'ON', 'NB', 'NS', 'PE', 'NL', 'MB', 'SK', 'AB', 'BC']),
  postal_code: z.string().regex(/^[A-Z]\d[A-Z] \d[A-Z]\d$/),
}).refine(
  (data) => !data.budget_max || !data.budget_min || data.budget_max >= data.budget_min,
  { message: "budget_max doit être >= budget_min" }
)

export const ProposalSchema = z.object({
  project_id: z.string().uuid(),
  amount: z.number().positive().max(10000000),
  timeline_days: z.number().int().positive().max(730),
  description: z.string().min(50).max(2000),
  warranty_terms: z.string().max(500).optional()
})

// Utilisation dans Edge Function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new Error(JSON.stringify(result.error.errors))
  }

  return result.data
}
```

**Frontend (appeler Edge Function au lieu de direct insert):**
```typescript
// Avant (VULNÉRABLE):
await supabase.from('projects').insert({ ...formData })

// Après (SÉCURISÉ):
const response = await fetch('/functions/v1/create-project', {
  method: 'POST',
  body: JSON.stringify(formData),
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## 📊 Monitoring & Alertes

### ACTION 16: Logging Structuré (pino) - 4h

**Installation:**
```bash
npm install pino pino-pretty
```

**Configuration:**
```typescript
// src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined,
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      '*.password',
      '*.token',
      'req.headers.authorization'
    ],
    remove: true
  }
})

// Usage
logger.info({ userId: user.id, projectId: project.id }, 'Project created')
logger.error({ err, userId: user.id }, 'Failed to create project')
logger.warn({ ip: req.ip, action: 'login_attempt' }, 'Multiple login failures')
```

**Intégration Edge Functions:**
```typescript
// supabase/functions/create-project/index.ts
import { logger } from '../_shared/logger.ts'

serve(async (req) => {
  const reqId = crypto.randomUUID()

  logger.info({ reqId, method: req.method, url: req.url }, 'Request started')

  try {
    // ... logique métier
    logger.info({ reqId, projectId: project.id }, 'Project created successfully')
  } catch (error) {
    logger.error({ reqId, err: error }, 'Project creation failed')
    throw error
  }
})
```

---

### ACTION 17: Alertes Sécurité (Slack/Email) - 2h

**Webhook Slack (optionnel):**
```typescript
// src/lib/alerts.ts
export async function sendSecurityAlert(
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  metadata?: Record<string, any>
) {
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Security Alert [${severity.toUpperCase()}]`,
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: message }
        }, {
          type: 'section',
          text: { type: 'mrkdwn', text: `\`\`\`${JSON.stringify(metadata, null, 2)}\`\`\`` }
        }]
      })
    })
  }

  // Fallback: log
  logger.warn({ severity, message, metadata }, 'Security alert')
}

// Usage
await sendSecurityAlert('high', 'Multiple failed login attempts', {
  ip: '1.2.3.4',
  user_email: 'test@example.com',
  attempts: 10
})
```

---

## 🧪 Tests de Sécurité

### ACTION 18: Tests Unitaires Sécurité - 6h

**Installation:**
```bash
npm install --save-dev @testing-library/react vitest
```

**Tests RLS:**
```typescript
// src/__tests__/security/rls.test.ts
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('RLS Policies - Notifications', () => {
  it('should prevent user from creating notifications for others', async () => {
    const user1 = await createTestUser()
    const user2 = await createTestUser()

    const { error } = await user1.supabase
      .from('notifications')
      .insert({
        user_id: user2.id,
        type: 'spam',
        message: 'Spam attempt'
      })

    expect(error).toBeTruthy()
    expect(error.message).toContain('row-level security policy')
  })

  it('should allow user to create self-notifications', async () => {
    const user = await createTestUser()

    const { data, error } = await user.supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'reminder',
        message: 'Test'
      })

    expect(error).toBeNull()
    expect(data).toBeTruthy()
  })
})
```

**Tests XSS:**
```typescript
// src/__tests__/security/xss.test.ts
import DOMPurify from 'dompurify'

describe('XSS Prevention', () => {
  it('should sanitize script tags', () => {
    const malicious = '<script>alert("XSS")</script>Hello'
    const sanitized = DOMPurify.sanitize(malicious)

    expect(sanitized).not.toContain('<script')
    expect(sanitized).toContain('Hello')
  })

  it('should sanitize event handlers', () => {
    const malicious = '<img src=x onerror="alert(1)">'
    const sanitized = DOMPurify.sanitize(malicious)

    expect(sanitized).not.toContain('onerror')
  })
})
```

**Run tests:**
```bash
npm run test:coverage
# Target: ≥80% coverage
```

---

## ✅ Checklist Court Terme

- [ ] **Loi 25 - Droits utilisateurs**
  - [ ] Endpoint export données (JSON)
  - [ ] Fonction "Supprimer mon compte"
  - [ ] Formulaire demandes accès/rectification
  - [ ] Tests fonctionnels (export + delete)

- [ ] **Sécurité avancée**
  - [ ] Rate limiting (Edge Functions)
  - [ ] Server-side validation (Zod)
  - [ ] Tests rate limiting (10+ tentatives login bloquées)

- [ ] **Monitoring**
  - [ ] Logging structuré (pino)
  - [ ] Alertes sécurité (Slack/email)
  - [ ] Dashboard monitoring (optionnel)

- [ ] **Tests**
  - [ ] Tests RLS (notifications, projects, contracts)
  - [ ] Tests XSS (DOMPurify)
  - [ ] Coverage ≥80%

---

## 🎯 Métriques de Succès

Après cette phase:

| Métrique | Target | Mesure |
|----------|--------|--------|
| **Conformité Loi 25** | 95%+ | Checklist complète |
| **OWASP ASVS L1** | 80%+ | Rate limit + validation server-side |
| **Test coverage** | ≥80% | `npm run test:coverage` |
| **Temps réponse demandes accès** | ≤30 jours | SLA Loi 25 |
| **Rate limit efficacité** | 100% | Brute force bloqué |

---

## 📞 Support

**Questions techniques:**
- docs/SECURITY_OPERATIONS.md
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

**Questions juridiques (Loi 25):**
- Responsable RP: privacy@batirnet.ca
- CAI Québec: 1-888-528-7741

---

**Prochaine phase:** Actions MOYEN TERME (J+30 à J+90)
**Document:** POST_MERGE_ACTIONS_MOYEN_TERME.md
