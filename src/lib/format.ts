import { format as formatDateFns } from "date-fns";
import { fr, enUS } from "date-fns/locale";

/**
 * Helpers de formatage partagés (monnaie CAD, dates localisées).
 * Centralise les implémentations dupliquées dans les pages/composants.
 */

export function currencyLocale(lang?: string): string {
  return lang && !lang.startsWith("fr") ? "en-CA" : "fr-CA";
}

/** Montant en dollars canadiens ; `fallback` est renvoyé si le montant est null/undefined/0. */
export function formatCurrency(
  amount: number | null | undefined,
  options: { lang?: string; currency?: string; fallback?: string } = {}
): string {
  const { lang, currency = "CAD", fallback = "Non spécifié" } = options;
  if (amount === null || amount === undefined || (amount === 0 && fallback)) {
    if (!amount) return fallback;
  }
  return new Intl.NumberFormat(currencyLocale(lang), { style: "currency", currency }).format(amount as number);
}

/** Montant strict (0 affiché comme 0,00 $), sans fallback. */
export function formatAmount(amount: number, options: { lang?: string; currency?: string } = {}): string {
  const { lang, currency = "CAD" } = options;
  return new Intl.NumberFormat(currencyLocale(lang), { style: "currency", currency }).format(amount);
}

/** Date longue localisée (ex. « 3 juillet 2026 ») ; `fallback` si null. */
export function formatDateLong(
  date: string | null | undefined,
  options: { lang?: string; fallback?: string; pattern?: string } = {}
): string {
  const { lang, fallback = "Non spécifiée", pattern } = options;
  if (!date) return fallback;
  const isFr = !lang || lang.startsWith("fr");
  return formatDateFns(new Date(date), pattern ?? (isFr ? "dd MMMM yyyy" : "PPP"), {
    locale: isFr ? fr : enUS,
  });
}
