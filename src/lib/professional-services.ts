/** Profiles store either a JSON-encoded array or a legacy comma-separated string. */
export const parseProfessionalServices = (value: unknown): string[] => {
  let items: unknown = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        items = JSON.parse(trimmed);
      } catch {
        return [];
      }
    } else {
      items = trimmed.split(',');
    }
  }

  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};
