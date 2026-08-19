const TYPOGRAPHY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u201B]/g, "'"],
  [/[\u201C\u201D\u201E\u201F]/g, '"'],
  [/[\u2013\u2014]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u2022\u25A0\u25A1\u2610\u2611]/g, '-'],
  [/[\u00A0\u202F]/g, ' '],
];

/**
 * Normalize arbitrary user text for the built-in Helvetica PDF font.
 * PDFKit's standard fonts cannot encode emoji and many Unicode symbols.
 */
export const sanitizePdfText = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  let normalized = String(value);
  TYPOGRAPHY_REPLACEMENTS.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  return Array.from(normalized)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126) || (code >= 161 && code <= 255);
    })
    .join('');
};
