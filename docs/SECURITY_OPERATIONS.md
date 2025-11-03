# 🔒 BâtirNet - Security & Operations Guide

**Version:** 1.0
**Date:** 2025-11-03
**Maintenu par:** Équipe Sécurité BâtirNet

---

## 📋 Table des Matières

1. [Architecture de Sécurité](#architecture-de-sécurité)
2. [Authentification & Autorisation](#authentification--autorisation)
3. [Protection des Données](#protection-des-données)
4. [Sécurité Backend](#sécurité-backend)
5. [Sécurité Frontend](#sécurité-frontend)
6. [CI/CD Security](#cicd-security)
7. [Gestion des Secrets](#gestion-des-secrets)
8. [Incident Response](#incident-response)
9. [Conformité & Audits](#conformité--audits)
10. [Checklist Sécurité](#checklist-sécurité)

---

## 🏗️ Architecture de Sécurité

### Stack Technique

```
┌─────────────────────────────────────────┐
│         Frontend (Vite + React)         │
│  - DOMPurify (XSS protection)          │
│  - React 18 (auto-escape)              │
│  - Zod validation                      │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│      Supabase (Backend as a Service)    │
│  - Auth: JWT (1h expiry)               │
│  - Database: PostgreSQL 15+            │
│  - RLS: Row-Level Security             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Node.js Server (Minimal)          │
│  - CORS whitelist                      │
│  - Security headers                    │
│  - No secrets hardcoded                │
└─────────────────────────────────────────┘
```

### Modèle de Menaces (Threat Model)

**Actifs Critiques:**
- Données utilisateurs (PII): nom, email, téléphone, adresse
- Credentials: JWT tokens, Supabase keys
- Données métier: projets, contrats, propositions, messages
- Audit trail: signatures électroniques, IP, geolocation

**Menaces Principales:**
1. **XSS (Cross-Site Scripting):** Injection de scripts malveillants dans les champs
2. **CSRF (Cross-Site Request Forgery):** Requêtes malveillantes cross-origin
3. **IDOR (Insecure Direct Object Reference):** Accès non autorisé aux ressources d'autres users
4. **SQL Injection:** Manipulation des requêtes DB (mitigé par Supabase client + RLS)
5. **Credential Stuffing:** Attaques brute-force sur login
6. **Data Breach:** Fuite de données sensibles via vulnérabilité

**Contrôles Implémentés:**
- ✅ XSS: DOMPurify sanitization + React auto-escape
- ✅ CSRF: CORS whitelist + SameSite cookies (future)
- ✅ IDOR: RLS policies sur toutes les tables
- ✅ SQLi: Supabase parameterized queries
- ⏳ Credential Stuffing: Rate limiting (TODO)
- ✅ Data Breach: RLS + encryption at rest (Supabase)

---

## 🔐 Authentification & Autorisation

### Supabase Auth

**Flux d'authentification:**

```
1. User entre email + password
2. Frontend → Supabase Auth API
3. Supabase valide credentials (bcrypt)
4. Retourne JWT token (1h expiry) + refresh token
5. JWT stocké dans localStorage (⚠️ XSS risk)
6. Chaque requête include JWT dans header Authorization
7. Supabase vérifie JWT signature + expiry
8. RLS policies enforce auth.uid() = user_id
```

**Configuration JWT:**
```typescript
// src/integrations/supabase/client.ts
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,    // Auto-refresh avant expiry
    persistSession: true,       // Persist session in localStorage
    storage: localStorage,      // ⚠️ Future: migrer vers sessionStorage
  }
});
```

**⚠️ RISQUES & MITIGATIONS:**

| Risque | Mitigation Actuelle | TODO |
|--------|---------------------|------|
| JWT dans localStorage → XSS | DOMPurify + React escape | Migrer vers HttpOnly cookies |
| Session fixation | Supabase rotate tokens | - |
| Brute force login | Aucune | **Implémenter rate limiting** |

### Row-Level Security (RLS)

**Toutes les tables ont RLS activé:**

```sql
-- Exemple: projects table
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = client_id);
```

**Tables protégées:**
- `profiles`, `projects`, `proposals`, `messages`, `notifications`
- `contracts`, `contract_audit_trail`, `signature_audit_trail`
- `conversations`, `conversation_participants`, `favorites`
- `reviews`, `bookings`, `portfolio_items`, etc.

**⚠️ CRITICAL:** Migration 022 fixe la policy permissive sur `notifications` (voir PR-2).

### RBAC (Role-Based Access Control)

**User types:**
```sql
CREATE TYPE user_type AS ENUM ('client', 'professional');
```

**Permissions:**
| Role | Permissions |
|------|-------------|
| **Client** | Créer projets, envoyer messages, accepter contrats, laisser reviews |
| **Professional** | Voir marketplace, soumettre proposals, gérer contrats, ajouter portfolio |

**Enforcement:** Au niveau RLS (via `user_type` enum dans `profiles` table).

---

## 🛡️ Protection des Données

### Données Personnelles (PII)

**Collectées dans `profiles` table:**
- Nom complet, email (via auth.users), téléphone
- Adresse: city, province, postal_code
- RBQ number (pour professionnels)
- Avatar URL, company info

**Chiffrement:**
- ✅ **En transit:** HTTPS (TLS 1.2+) entre frontend ↔ Supabase
- ✅ **Au repos:** Supabase PostgreSQL encryption at rest (AES-256)
- ❌ **Field-level:** Pas de chiffrement field-level (non requis pour L1)

**Audit Trail:**
```sql
-- signature_audit_trail table
CREATE TABLE signature_audit_trail (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  action TEXT,  -- 'viewed', 'signed', 'downloaded'
  ip_address TEXT,
  user_agent TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Minimisation des données:**
- Geolocation (lat/long) collectée **uniquement** pour signatures contrat
- IP address + User-Agent pour audit trail signatures
- Pas de collecte de données non nécessaires

**Rétention:**
- ⏳ **TODO:** Définir politique de rétention (ex: 7 ans pour contrats, 1 an pour logs)
- ⏳ **TODO:** Implémenter anonymisation/suppression automatique

---

## 🔧 Sécurité Backend

### Node.js Server (`server/index.js`)

**Endpoints exposés:**
```
GET  /health          → Health check
GET  /api/v1/ping     → Ping
POST /api/v1/echo     → Echo (dev only)
GET  /api/v1/client-ip → IP address (pour audit trail)
```

**Security Headers (PR-2):**
```javascript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}
```

**CORS Whitelist:**
```javascript
const ALLOWED_ORIGINS = [
  'https://batirnet.ca',
  'https://www.batirnet.ca',
  // Dev only:
  'http://localhost:5173',
  'http://localhost:8080'
];
```

**⚠️ CONFIGURATION REQUISE:**
En production, définir:
```bash
NODE_ENV=production  # Désactive dev origins
```

---

## 🎨 Sécurité Frontend

### XSS Prevention

**DOMPurify Sanitization:**
```typescript
// src/lib/pdf-export.ts
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['div', 'p', 'strong', 'em', ...],
  FORBID_TAGS: ['script', 'iframe', 'object'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload']
});
```

**React Auto-Escape:**
```tsx
// ✅ Sécurisé: React escape automatiquement
<p>{project.description}</p>

// ❌ DANGER: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// N'utiliser QUE si sanitized avec DOMPurify
```

### Validation d'Entrées

**Zod Schemas (client-side):**
```typescript
// TODO: Ajouter validation server-side via Supabase Edge Functions
const ProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000),
  budget_min: z.number().positive().optional(),
  // ...
});
```

**File Upload Validation:**
```typescript
// src/pages/Auth.tsx:81-103
const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];
const maxSize = 5 * 1024 * 1024; // 5MB
```

**⚠️ TODO (PR-3):**
- Server-side validation (Supabase Edge Functions)
- MIME type strict validation (magic bytes check)
- Antivirus scan pour file uploads (ClamAV via Edge Function)

---

## ⚙️ CI/CD Security

### GitHub Actions Workflows

**1. CodeQL (SAST):**
- Scan automatique pour 90+ vulnérabilités
- Runs: push, PR, weekly schedule
- Results → GitHub Security alerts

**2. Dependency Review:**
- Scan PRs pour vulnérabilités nouvelles
- Bloque merge si vuln moderate+
- License compliance (MIT, Apache OK; GPL bloqué)

**3. Dependabot:**
- PRs hebdomadaires pour updates sécurité
- Auto-grouping minor/patch updates

**4. Security Audit:**
- `npm audit` quotidien
- SBOM generation (CycloneDX)
- depcheck pour deps inutilisées

**5. Secret Scanning:**
- Gitleaks détecte API keys, tokens, credentials
- Bloque commit si secret exposé

**Configuration:** Voir `.github/workflows/` et `PR4_CICD_SECURITY_SUMMARY.md`

---

## 🔑 Gestion des Secrets

### Variables d'Environnement

**`.env` (JAMAIS commité!):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...  # Public key (safe)
```

**`.env.example` (template commité):**
```bash
# Template avec placeholders
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
```

**⚠️ SECRETS JAMAIS EXPOSÉS:**
```bash
# ❌ NE JAMAIS mettre dans .env frontend:
SUPABASE_SERVICE_ROLE_KEY=...   # Server-side ONLY!
DATABASE_URL=...                 # Server-side ONLY!
JWT_SECRET=...                   # Server-side ONLY!
```

**Rotation des Secrets:**

1. **Après fuite détectée:**
   ```bash
   # 1. Purge .env de l'historique Git (BFG)
   java -jar bfg.jar --delete-files .env

   # 2. Rotate keys dans Supabase Dashboard
   # Settings → API → Rotate keys

   # 3. Update .env local
   ```

2. **Rotation régulière (best practice):**
   - Service Role Key: tous les 90 jours
   - JWT secret: tous les 180 jours

**GitHub Secrets:**
```bash
# Pour CI/CD workflows
Settings → Secrets and variables → Actions
- GITLEAKS_LICENSE (optionnel)
- SLACK_WEBHOOK (pour notifications)
```

---

## 🚨 Incident Response

### Détection

**Sources d'alertes:**
1. **GitHub Security Alerts** (CodeQL, Dependabot, Secret Scanning)
2. **Supabase Dashboard** (rate limit hits, auth failures)
3. **CI/CD Failures** (npm audit, tests failed)
4. **User Reports** (support tickets)

### Procédure de Réponse

**Phase 1: Containment (0-2h)**
```bash
# Si credential leak:
1. Rotate immediately dans Supabase Dashboard
2. Invalider tous les JWT tokens actifs (si applicable)
3. Bloquer IP suspectes (Supabase → Auth → Ban user)

# Si vulnérabilité exploitée:
1. Patcher immédiatement (hotfix branch)
2. Deploy en urgence
3. Notifier users affectés (si data breach)
```

**Phase 2: Investigation (2-24h)**
```bash
# Audit trail:
SELECT * FROM signature_audit_trail
WHERE created_at > '2025-11-01'
  AND ip_address = 'suspicious-ip';

# Logs Supabase:
# Dashboard → Logs → Filter par user_id / IP
```

**Phase 3: Remediation (24-72h)**
- Fix vulnérabilité (PR avec tests)
- Post-mortem document
- Update incident registry (Loi 25)

**Phase 4: Post-Incident (72h+)**
- Lessons learned
- Update security procedures
- Communication publique (si breach majeur)

### Loi 25 - Incident de Confidentialité

**Obligations légales:**
1. **Registre d'incidents** (Art. 63.5)
   - Date, nature, circonstances
   - Renseignements compromis
   - Mesures prises

2. **Avis à la CAI** (Commission d'Accès à l'Information)
   - Si risque de préjudice sérieux
   - Dans les plus brefs délais

3. **Avis aux personnes concernées**
   - Si risque de préjudice sérieux
   - Par communication directe

**Template avis incident:**
```
Objet: Avis d'incident de confidentialité - BâtirNet

Nous vous informons qu'un incident de confidentialité s'est produit le [DATE].

Nature de l'incident: [Description]
Renseignements compromis: [Liste]
Mesures prises: [Actions]
Recommandations: [Ex: changer mot de passe]

Contact: [Responsable de la protection RP]
```

---

## 📜 Conformité & Audits

### OWASP ASVS 5.0

**Niveau de conformité actuel:**
- **Level 1 (L1):** 75% conforme ✅
- **Level 2 (L2):** 55% conforme ⚠️

**Gaps principaux (L1):**
- Rate limiting (V11.1.4)
- Server-side validation (V5.1.1)
- 2FA optionnel (V1.2.4)

**Roadmap:**
- Q1 2026: Rate limiting (Supabase Edge Functions)
- Q2 2026: Server-side validation (Zod + Edge Functions)
- Q3 2026: 2FA (Supabase Auth MFA)
- Q4 2026: L2 compliance (80%+)

### Loi 25 (Québec)

**Conformité actuelle:**
- ✅ Politique de confidentialité (POLITIQUE_CONFIDENTIALITE.md)
- ⏳ Responsable de la protection (à nommer + afficher sur site)
- ⏳ Registre d'incidents (template créé, à opérationnaliser)
- ⏳ Mécanisme demandes d'accès/suppression (à implémenter)

**TODO Q1 2026:**
- [ ] Nommer responsable RP (+ afficher sur site)
- [ ] Implémenter endpoint export données user (JSON)
- [ ] Implémenter fonction "Supprimer mon compte" + anonymisation
- [ ] Bannière consentement cookies (si tracking analytics)

### NIST SSDF

**Practices implémentées:**
- ✅ PW.4: Review code (CodeQL)
- ✅ PW.7: Test code (CI tests)
- ✅ PW.8: Manage dependencies (Dependabot)
- ✅ PS.1: Protect integrity (lock files)
- ✅ PS.2: Archive SBOM (artifacts)
- ✅ RV.1: Identify vulnerabilities (scans)

**Niveau:** SSDF Level 2 (Practices essentielles)

---

## ✅ Checklist Sécurité

### Pre-Production Checklist

**Backend:**
- [ ] Secrets purgés de l'historique Git (BFG)
- [ ] Supabase keys rotated (post-purge)
- [ ] RLS activé sur toutes les tables sensibles
- [ ] Migration 022 appliquée (fix notifications RLS)
- [ ] CORS whitelist configuré (production origins seulement)
- [ ] Security headers activés (X-Frame-Options, etc.)
- [ ] Rate limiting implémenté (TODO)

**Frontend:**
- [ ] DOMPurify utilisé pour tout innerHTML
- [ ] Validation Zod sur tous les forms
- [ ] Pas de dangerouslySetInnerHTML (ou sanitized)
- [ ] JWT tokens pas exposés côté client (localStorage actuel → migrer cookies)

**CI/CD:**
- [ ] CodeQL activé (GitHub Security settings)
- [ ] Secret Scanning activé + Push Protection
- [ ] Dependabot activé
- [ ] Branch protection sur main (require status checks)
- [ ] SBOM généré et archivé

**Compliance:**
- [ ] Politique de confidentialité publiée
- [ ] Responsable RP nommé + affiché
- [ ] Registre d'incidents prêt
- [ ] Procédure avis CAI/users documentée

### Pre-Deployment Checklist

**Chaque release:**
- [ ] Run `npm audit` (0 critical/high)
- [ ] Run `npm run test:coverage` (≥80%)
- [ ] CodeQL scan passed (0 high/critical)
- [ ] Secrets scanned (Gitleaks)
- [ ] SBOM généré et archivé
- [ ] Changelog de sécurité (si fixes)

**Post-deployment:**
- [ ] Smoke tests (auth, DB, API)
- [ ] Monitor logs (Supabase Dashboard)
- [ ] Vérifier security headers (curl -I)
- [ ] Test CORS (depuis frontend prod)

---

## 📞 Contacts Sécurité

**Responsable de la Protection des Renseignements Personnels:**
- Nom: [À DÉFINIR]
- Email: privacy@batirnet.ca
- Téléphone: [À DÉFINIR]

**Équipe Sécurité:**
- Security Lead: [À DÉFINIR]
- DevSecOps: [À DÉFINIR]

**Reporting de Vulnérabilités:**
- Email: security@batirnet.ca
- PGP Key: [Optionnel]

**Responsible Disclosure:**
- Délai de réponse: 48h
- Délai de patch: 30 jours (high), 90 jours (medium)
- Bug bounty: Non (future)

---

## 📚 Ressources

**Standards:**
- [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST SSDF SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final)
- [Loi 25 CAI Québec](https://www.cai.gouv.qc.ca/)

**Guides:**
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [React Security](https://react.dev/learn/security)

**Interne:**
- [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md)
- [POLITIQUE_CONFIDENTIALITE.md](../POLITIQUE_CONFIDENTIALITE.md)
- [PR Summaries](../PR*_SUMMARY.md)

---

**Document Version:** 1.0
**Dernière mise à jour:** 2025-11-03
**Prochaine révision:** 2025-12-03 (mensuelle)
