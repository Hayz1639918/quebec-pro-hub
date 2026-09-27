import { loadRequiredDocumentOptions, resolveRequiredDocuments, serializeRequiredDocuments } from '@/lib/required-documents';
import { normalizeTenderProject } from '@/lib/tender-mapper';
import type { Database } from '@/integrations/supabase/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

const tenderWithDocuments = (required_documents: unknown) => normalizeTenderProject({
  id: 'project-id', title: 'Rénovation', required_documents,
} as ProjectRow);

describe('Required project documents', () => {
  it('keeps an explicit empty selection empty through edit, save and tender mapping', () => {
    const options = loadRequiredDocumentOptions(['Copie de la licence RBQ valide']);
    const saved = serializeRequiredDocuments(options.map((option) => ({ ...option, checked: false })));
    const reloaded = loadRequiredDocumentOptions(saved);
    expect(serializeRequiredDocuments(reloaded)).toEqual([]);
    expect(resolveRequiredDocuments(tenderWithDocuments(saved).required_documents)).toEqual([]);
  });

  it('restores exactly the stored selection and preserves custom requirements on an unrelated edit', () => {
    const stored = ['Minimum trois (3) références de projets similaires', 'Plan de protection des lieux'];
    const saved = serializeRequiredDocuments(loadRequiredDocumentOptions(stored));
    expect(saved).toEqual(stored);
    expect(resolveRequiredDocuments(tenderWithDocuments(saved).required_documents)).toEqual(stored);
  });

  it.each([null, undefined])('uses the legacy defaults only when documents are absent (%s)', (missing) => {
    const documents = resolveRequiredDocuments(tenderWithDocuments(missing).required_documents);
    expect(documents).toHaveLength(4);
    expect(documents).toContain('Copie de la licence RBQ valide');
    expect(serializeRequiredDocuments(loadRequiredDocumentOptions(missing))).toEqual(documents);
  });
});
