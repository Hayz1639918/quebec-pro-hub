export interface RequiredDocumentOption {
  id: string;
  label: string;
  checked: boolean;
}

export const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocumentOption[] = [
  { id: "submission_form", label: "Formulaire de soumission dûment complété et signé", checked: true },
  { id: "license_copy", label: "Copie de la licence RBQ valide", checked: true },
  { id: "insurance_cert", label: "Certificats d'assurance en vigueur", checked: true },
  { id: "detailed_quote", label: "Devis détaillé et échéancier proposé", checked: true },
  { id: "references", label: "Minimum trois (3) références de projets similaires", checked: false },
  { id: "subcontractors_list", label: "Liste des sous-traitants (si applicable)", checked: false },
];

/** Null denotes a legacy project; [] explicitly means no documents required. */
export const resolveRequiredDocuments = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : DEFAULT_REQUIRED_DOCUMENTS.filter((item) => item.checked).map((item) => item.label);

export const loadRequiredDocumentOptions = (value: unknown): RequiredDocumentOption[] => {
  const selected = resolveRequiredDocuments(value);
  const knownLabels = new Set(DEFAULT_REQUIRED_DOCUMENTS.map((item) => item.label));
  return [
    ...DEFAULT_REQUIRED_DOCUMENTS.map((item) => ({ ...item, checked: selected.includes(item.label) })),
    // Preserve existing custom requirements when an owner edits another field.
    ...selected.filter((label) => !knownLabels.has(label)).map((label, index) => ({
      id: `custom_required_document_${index}`,
      label,
      checked: true,
    })),
  ];
};

export const serializeRequiredDocuments = (options: RequiredDocumentOption[]): string[] =>
  options.filter((item) => item.checked).map((item) => item.label);
