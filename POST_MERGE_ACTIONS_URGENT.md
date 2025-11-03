# 🚨 Actions POST-MERGE URGENT (J+0 à J+7)

**Date:** 2025-11-03
**Status:** Merge dans main COMPLÉTÉ ✅
**Prochaine étape:** Exécuter actions URGENT ci-dessous

---

## ✅ COMPLÉTÉ

- [x] Merge branche `claude/audit-harden-batirnet-saas-011CUe8879SVxHnKYKrUSJZz` dans `main`
- [x] Création script de purge Git (`scripts/purge-env-from-history.sh`)
- [x] Documentation complète (5 PRs, 150+ pages)

---

## 🔴 URGENT - Actions Requises (CRITIQUE)

### PR-1: Secrets Management

#### ⚠️ ACTION 1: Purger .env de l'historique Git (30 min)

**Pourquoi:** Le fichier `.env` contient des credentials Supabase exposés dans l'historique Git (commits `bcf3428`, `335da65`). Même après suppression, ils restent dans l'historique.

**Comment:**

**Option A: Script automatisé (RECOMMANDÉ)**
```bash
cd /home/user/quebec-pro-hub
./scripts/purge-env-from-history.sh
# Suivre les instructions interactives
```

**Option B: Manuel avec BFG**
```bash
# 1. Télécharger BFG Repo-Cleaner
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -O bfg.jar

# 2. Purger .env
java -jar bfg.jar --delete-files .env

# 3. Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push
git push origin --force --all
git push origin --force --tags
```

**Vérification:**
```bash
# Doit retourner vide (aucun commit)
git log --all --full-history --oneline -- .env
```

**Référence:**
- PR1_CLEANUP_SUMMARY.md
- OWASP ASVS V14.2.1
- OWASP Secrets Management Cheat Sheet

---

#### 🔑 ACTION 2: Régénérer clés Supabase (10 min)

**Pourquoi:** Les clés exposées dans `.env` (historique Git) sont compromises. La rotation est OBLIGATOIRE.

**Comment:**

1. **Aller dans Supabase Dashboard:**
   - URL: https://app.supabase.com/project/gsnjnhxzacwjslirfxgy/settings/api

2. **Rotate les clés:**
   - Section "Project API keys"
   - Cliquer "Rotate" pour:
     - ✅ `anon` (public) key
     - ✅ `service_role` key (si utilisée)

3. **Mettre à jour `.env` local:**
   ```bash
   cp .env.example .env
   # Éditer .env avec les NOUVELLES clés
   nano .env
   ```

4. **Redémarrer l'application:**
   ```bash
   npm run dev
   # Vérifier que l'auth fonctionne
   ```

**⚠️ IMPORTANT:** Ne PAS commiter le nouveau `.env` - il est déjà dans `.gitignore`.

---

#### 📧 ACTION 3: Notifier collaborateurs (si équipe)

**Message type:**

```
Subject: 🔐 URGENT: Re-clone du repo BâtirNet requis

Bonjour,

Nous avons effectué un audit de sécurité complet et purgé des secrets
de l'historique Git. Cela nécessite une réinitialisation complète:

ACTIONS REQUISES:
1. Supprimer votre clone local du repo
2. Re-cloner: git clone <repo-url>
3. Copier .env.example → .env
4. Me demander les nouvelles clés Supabase (rotées)

DÉLAI: Avant <date J+2>

Merci,
[Responsable Sécurité]
```

---

### PR-2: Backend Hardening

#### 🗄️ ACTION 4: Appliquer migration 022 (RLS notifications) (15 min)

**Pourquoi:** Fix vulnérabilité CRITIQUE - RLS permissive permet spam de notifications.

**Comment:**

**Option A: Supabase CLI (local)**
```bash
cd /home/user/quebec-pro-hub

# 1. Vérifier connexion Supabase
npx supabase status

# 2. Appliquer migration
npx supabase db push

# 3. Vérifier que migration 022 est appliquée
npx supabase db diff
```

**Option B: Supabase Dashboard (web)**
```sql
-- 1. Aller dans: https://app.supabase.com/project/gsnjnhxzacwjslirfxgy/sql/new
-- 2. Copier le contenu de: supabase/migrations/022_fix_notifications_rls_secure.sql
-- 3. Coller dans l'éditeur SQL
-- 4. Exécuter (Run)
-- 5. Vérifier succès: "Success. No rows returned"
```

**Vérification:**
```sql
-- Tester la nouvelle policy
-- En tant que user A, tenter de créer notification pour user B (doit ÉCHOUER)
INSERT INTO notifications (user_id, type, message)
VALUES ('other-user-uuid', 'spam', 'Test spam');
-- Erreur attendue: new row violates row-level security policy
```

**Référence:**
- PR2_BACKEND_HARDENING_SUMMARY.md
- Migration 022 (supabase/migrations/022_fix_notifications_rls_secure.sql)
- OWASP ASVS V4.1.1

---

#### 🧪 ACTION 5: Tester correctifs XSS et CORS (30 min)

**Test 1: XSS Prevention (DOMPurify)**
```typescript
// 1. Créer un projet avec description malveillante
const maliciousDescription = '<script>alert("XSS")</script>Normal text';

// 2. Exporter le projet en PDF (bouton "Export PDF")

// 3. Vérifier dans le PDF généré:
// ✅ "Normal text" est présent
// ✅ <script> est ABSENT (supprimé par DOMPurify)
```

**Test 2: CORS Whitelist**
```bash
# Depuis un domaine NON autorisé (doit ÉCHOUER)
curl -H "Origin: https://evil.com" http://localhost:5174/health
# ✅ Pas de header Access-Control-Allow-Origin

# Depuis localhost (dev mode, doit RÉUSSIR)
curl -H "Origin: http://localhost:5173" http://localhost:5174/health
# ✅ Header Access-Control-Allow-Origin: http://localhost:5173
```

**Test 3: Security Headers**
```bash
curl -I http://localhost:5174/health

# ✅ Vérifier présence de:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block

# ✅ Vérifier ABSENCE de:
# X-Powered-By: (doit être absent)
```

---

### PR-4: CI/CD Security

#### ⚙️ ACTION 6: Activer GitHub Security Features (30 min)

**6.1 - CodeQL Code Scanning**

1. GitHub repo → Settings → Security → Code security and analysis
2. Cliquer **"Set up"** sur "Code scanning"
3. Choisir "CodeQL Analysis"
4. GitHub détectera `.github/workflows/codeql.yml` (déjà créé ✅)
5. Cliquer "Enable CodeQL"

**Vérification:**
- Aller dans Security → Code scanning
- Premier scan démarre automatiquement (~5 min)
- Attendre résultats (0 alerts attendus)

---

**6.2 - Secret Scanning + Push Protection**

1. Settings → Security → Code security and analysis
2. **"Secret scanning"** → Enable
3. **"Push protection"** → Enable (bloque commits avec secrets)

**Vérification:**
```bash
# Tester protection (doit BLOQUER le commit)
echo "SUPABASE_KEY=fake-key-12345" > test-secret.txt
git add test-secret.txt
git commit -m "test secret"
# ✅ Erreur attendue: "Secret scanning detected..."

# Cleanup
git reset HEAD test-secret.txt
rm test-secret.txt
```

---

**6.3 - Dependabot Security Updates**

1. Settings → Security → Code security and analysis
2. **"Dependabot security updates"** → Enable
3. **"Dependabot version updates"** → Enable

**Configuration:**
- Fichier `.github/dependabot.yml` déjà créé ✅
- PRs hebdomadaires (lundi 00:00 America/Toronto)

**Vérification:**
- Attendre lundi prochain (première run)
- Onglet "Pull requests" → voir PRs Dependabot

---

**6.4 - Branch Protection (main)**

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Cocher:
   - ✅ **Require status checks to pass**
     - CodeQL Security Analysis
     - npm Security Audit
     - Run Tests
   - ✅ **Require pull request reviews before merging** (1 reviewer)
   - ✅ **Dismiss stale pull request approvals**
   - ✅ **Require linear history** (optionnel)
4. Save changes

**Résultat:** Impossible de push directement vers `main` sans PR + checks.

---

### PR-5: Documentation & Loi 25

#### 📜 ACTION 7: Nommer Responsable Protection RP (1h)

**Pourquoi:** Obligation légale Loi 25 Art. 3.2

**Étapes:**

1. **Choisir une personne qualifiée:**
   - Connaissance RGPD/Loi 25
   - Autorité pour prendre décisions vie privée
   - Peut être interne ou externe (consultant)

2. **Mettre à jour POLITIQUE_CONFIDENTIALITE.md:**
   ```markdown
   **Nom:** Jean Dupont
   **Titre:** Responsable de la Protection des Renseignements Personnels
   **Email:** privacy@batirnet.ca
   **Téléphone:** 514-555-1234
   **Adresse:** 123 rue Example, Montréal, QC H1X 1X1
   ```

3. **Afficher sur le site web:**
   - Page dédiée: `/responsable-protection`
   - Ou dans footer: "Protection des données: Jean Dupont"

**⚠️ DÉLAI LÉGAL:** 30 jours

---

#### 🌐 ACTION 8: Publier Politique de Confidentialité (2h)

**Étapes:**

1. **Créer page `/politique-confidentialite`:**
   ```tsx
   // src/pages/PolitiqueConfidentialite.tsx
   import { useEffect } from 'react';
   import POLITIQUE from '../../../POLITIQUE_CONFIDENTIALITE.md?raw';

   export default function PolitiqueConfidentialite() {
     return (
       <div className="container mx-auto px-4 py-8 prose">
         <div dangerouslySetInnerHTML={{ __html: marked(POLITIQUE) }} />
       </div>
     );
   }
   ```

2. **Ajouter route dans React Router:**
   ```tsx
   <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
   ```

3. **Ajouter lien dans footer:**
   ```tsx
   <footer>
     <a href="/politique-confidentialite">Politique de confidentialité</a>
     <a href="/responsable-protection">Protection des données</a>
   </footer>
   ```

4. **Afficher lors de la création de compte:**
   - Checkbox: "J'ai lu et j'accepte la [Politique de confidentialité](/politique-confidentialite)"

---

#### 📧 ACTION 9: Créer email privacy@batirnet.ca (15 min)

**Options:**

**Option A: Redirection email (simple)**
```
# Dans votre provider email (ex: cPanel, Gmail Workspace):
Créer alias: privacy@batirnet.ca → jean.dupont@batirnet.ca
```

**Option B: Boîte dédiée (pro)**
```
# Créer vraie boîte email
privacy@batirnet.ca
Assigné au Responsable RP
```

**Test:**
```bash
echo "Test privacy email" | mail -s "Test" privacy@batirnet.ca
# Vérifier réception
```

---

#### 📋 ACTION 10: Créer Registre d'Incidents (30 min)

**Pourquoi:** Obligation Loi 25 Art. 63.5 - conserver 5 ans

**Option A: Spreadsheet (simple)**
```
# Google Sheets ou Excel avec colonnes:
- Date incident
- Heure incident
- Nature (ex: "Accès non autorisé", "Fuite de données")
- Renseignements compromis (ex: "Emails de 50 users")
- Personnes concernées (nombre)
- Mesures prises
- CAI notifiée? (Oui/Non)
- Personnes notifiées? (Oui/Non)
- Responsable du suivi
- Statut (Ouvert/Résolu)
```

**Option B: Table Supabase (pro)**
```sql
CREATE TABLE incident_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_date TIMESTAMPTZ NOT NULL,
  nature TEXT NOT NULL,
  compromised_data TEXT NOT NULL,
  affected_count INT,
  measures_taken TEXT,
  cai_notified BOOLEAN DEFAULT false,
  persons_notified BOOLEAN DEFAULT false,
  responsible_person TEXT,
  status TEXT CHECK (status IN ('open', 'investigating', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Accès:** Réserver au Responsable RP + direction

---

## 📊 Checklist de Vérification

Après avoir complété toutes les actions ci-dessus:

### Sécurité

- [ ] `.env` purgé de l'historique Git (vérification: `git log --all -- .env` = vide)
- [ ] Clés Supabase régénérées (anciennes clés invalides)
- [ ] Migration 022 appliquée (RLS notifications stricte)
- [ ] Tests XSS passés (DOMPurify fonctionne)
- [ ] Tests CORS passés (whitelist fonctionne)
- [ ] Security headers présents (curl -I)

### CI/CD

- [ ] CodeQL activé (premier scan complété, 0 alerts)
- [ ] Secret Scanning activé (push protection testée)
- [ ] Dependabot activé (config visible dans Settings)
- [ ] Branch protection sur main (impossible de push direct)

### Loi 25

- [ ] Responsable RP nommé (nom/coordonnées dans politique)
- [ ] Politique publiée sur site (`/politique-confidentialite`)
- [ ] Email privacy@batirnet.ca créé (testé)
- [ ] Registre d'incidents créé (spreadsheet ou DB)
- [ ] Responsable RP affiché sur site (footer ou page dédiée)

---

## 🚀 Post-Validation

Une fois TOUTES les actions ci-dessus complétées:

1. **Notifier l'équipe:**
   ```
   Subject: ✅ Security Audit - Actions URGENT complétées

   L'audit de sécurité BâtirNet est complété:
   - 4 vulnérabilités CRITIQUES corrigées
   - CI/CD security activée (CodeQL, Dependabot)
   - Conformité Loi 25: 80% → 95%

   Prochaines étapes: Actions COURT TERME (J+7 à J+30)
   Voir: POST_MERGE_ACTIONS_COURT_TERME.md
   ```

2. **Générer rapport de conformité:**
   - Score sécurité: 8.5/10 ✅
   - OWASP ASVS L1: 75% ✅
   - Loi 25: 95% ✅

3. **Planifier actions COURT TERME** (J+7 à J+30)

---

## 📞 Support

**Questions sécurité:**
- Voir: `docs/SECURITY_OPERATIONS.md`
- Rapport complet: `SECURITY_AUDIT_REPORT.md`

**Questions Loi 25:**
- CAI Québec: 1-888-528-7741
- Guide: https://www.cai.gouv.qc.ca/modernisation/

**Bugs/Issues:**
- GitHub Issues: https://github.com/hayz0622/quebec-pro-hub/issues

---

**Dernière mise à jour:** 2025-11-03
**Prochaine révision:** J+7 (vérification complétude)
