import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';

// Les ressources de traduction
const resources = {
  fr: {
    translation: translationFR
  },
  en: {
    translation: translationEN
  }
};

i18n
  // Détection automatique de la langue du navigateur
  .use(LanguageDetector)
  // Passe l'instance i18n à react-i18next
  .use(initReactI18next)
  // Initialise i18next
  .init({
    resources,
    fallbackLng: 'fr', // Langue par défaut si détection échoue
    lng: 'fr', // Langue initiale
    debug: false, // Mode debug (mettre à true pour voir les logs)
    
    // Options de détection
    detection: {
      // Ordre de détection: localStorage -> cookie -> navigateur -> défaut
      order: ['localStorage', 'cookie', 'navigator'],
      // Clés de stockage
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
      // Cache la sélection de langue
      caches: ['localStorage', 'cookie'],
    },

    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    },

    // Fallback pour les clés manquantes
    keySeparator: '.',
    
    react: {
      useSuspense: false // Désactive le suspense pour éviter les problèmes
    }
  });

export default i18n;

