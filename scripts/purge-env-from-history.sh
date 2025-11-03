#!/bin/bash
#
# Script pour purger .env de l'historique Git
# ATTENTION: Ce script réécrit l'historique Git - nécessite force push
# Tous les collaborateurs devront re-cloner le repo
#
# Référence: PR1_CLEANUP_SUMMARY.md
# OWASP ASVS V14.2.1: No credentials in code

set -e  # Exit on error

echo "========================================="
echo "  Purge .env de l'historique Git"
echo "========================================="
echo ""
echo "⚠️  AVERTISSEMENT:"
echo "   - Ce script RÉÉCRIT l'historique Git"
echo "   - Nécessite un FORCE PUSH vers origin"
echo "   - Tous les collaborateurs devront RE-CLONER le repo"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Opération annulée."
    exit 0
fi

echo ""
echo "Choisissez la méthode de purge:"
echo ""
echo "1) BFG Repo-Cleaner (RECOMMANDÉ - rapide, sûr)"
echo "   - Télécharger: https://reclaimtheweb.org/download-bfg-repo-cleaner/"
echo "   - Nécessite Java"
echo ""
echo "2) git filter-repo (moderne, recommandé par Git)"
echo "   - Installer: pip install git-filter-repo"
echo ""
echo "3) git filter-branch (legacy, lent mais fonctionne partout)"
echo "   - Intégré à Git, pas d'installation"
echo ""
read -p "Votre choix (1/2/3): " method

case $method in
    1)
        echo ""
        echo "=== Méthode 1: BFG Repo-Cleaner ==="
        echo ""

        # Vérifier si BFG est disponible
        if [ ! -f "bfg.jar" ]; then
            echo "❌ Fichier bfg.jar non trouvé."
            echo ""
            echo "Téléchargez BFG depuis:"
            echo "https://reclaimtheweb.org/download-bfg-repo-cleaner/"
            echo ""
            echo "Puis placez bfg.jar dans ce répertoire et relancez le script."
            exit 1
        fi

        echo "✅ BFG trouvé. Démarrage de la purge..."
        echo ""

        # Backup du repo
        echo "1. Création d'un backup..."
        cd ..
        cp -r quebec-pro-hub quebec-pro-hub-backup
        cd quebec-pro-hub
        echo "   ✅ Backup créé: ../quebec-pro-hub-backup"
        echo ""

        # Purge avec BFG
        echo "2. Purge de .env avec BFG..."
        java -jar bfg.jar --delete-files .env
        echo "   ✅ Fichier .env supprimé de l'historique"
        echo ""

        # Cleanup
        echo "3. Nettoyage du repo..."
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        echo "   ✅ Nettoyage terminé"
        ;;

    2)
        echo ""
        echo "=== Méthode 2: git filter-repo ==="
        echo ""

        # Vérifier si git-filter-repo est installé
        if ! command -v git-filter-repo &> /dev/null; then
            echo "❌ git-filter-repo n'est pas installé."
            echo ""
            echo "Installez-le avec:"
            echo "  pip install git-filter-repo"
            echo ""
            echo "Puis relancez le script."
            exit 1
        fi

        echo "✅ git-filter-repo trouvé. Démarrage de la purge..."
        echo ""

        # Backup du repo
        echo "1. Création d'un backup..."
        cd ..
        cp -r quebec-pro-hub quebec-pro-hub-backup
        cd quebec-pro-hub
        echo "   ✅ Backup créé: ../quebec-pro-hub-backup"
        echo ""

        # Purge avec git-filter-repo
        echo "2. Purge de .env avec git-filter-repo..."
        git filter-repo --invert-paths --path .env --force
        echo "   ✅ Fichier .env supprimé de l'historique"
        ;;

    3)
        echo ""
        echo "=== Méthode 3: git filter-branch (legacy) ==="
        echo ""

        # Backup du repo
        echo "1. Création d'un backup..."
        cd ..
        cp -r quebec-pro-hub quebec-pro-hub-backup
        cd quebec-pro-hub
        echo "   ✅ Backup créé: ../quebec-pro-hub-backup"
        echo ""

        # Purge avec git filter-branch
        echo "2. Purge de .env avec git filter-branch..."
        git filter-branch --force --index-filter \
          "git rm --cached --ignore-unmatch .env" \
          --prune-empty --tag-name-filter cat -- --all
        echo "   ✅ Fichier .env supprimé de l'historique"
        echo ""

        # Cleanup
        echo "3. Nettoyage du repo..."
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        echo "   ✅ Nettoyage terminé"
        ;;

    *)
        echo "❌ Choix invalide. Opération annulée."
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "  ✅ Purge terminée avec succès!"
echo "========================================="
echo ""
echo "📋 PROCHAINES ÉTAPES OBLIGATOIRES:"
echo ""
echo "1. Vérifier que .env a bien été supprimé de l'historique:"
echo "   git log --all --full-history --oneline -- .env"
echo "   (Doit retourner vide)"
echo ""
echo "2. Re-ajouter origin (si git-filter-repo utilisé):"
echo "   git remote add origin <your-repo-url>"
echo ""
echo "3. Force push vers origin:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "4. 🔑 RÉGÉNÉRER LES CLÉS SUPABASE:"
echo "   - Aller dans Supabase Dashboard → Settings → API"
echo "   - Cliquer sur 'Rotate' pour ANON key et SERVICE_ROLE key"
echo "   - Mettre à jour votre .env local avec les nouvelles clés"
echo ""
echo "5. Notifier tous les collaborateurs:"
echo "   - Supprimer leur clone local"
echo "   - Re-cloner: git clone <repo-url>"
echo "   - Copier .env.example → .env et remplir avec nouvelles clés"
echo ""
echo "6. Activer GitHub Secret Scanning:"
echo "   - Settings → Security → Enable Secret Scanning"
echo "   - Enable Push Protection (bloque future commits avec secrets)"
echo ""
echo "⚠️  IMPORTANT:"
echo "   Même après la purge, les anciennes clés Supabase sont compromises."
echo "   La rotation est OBLIGATOIRE pour sécuriser l'application."
echo ""
