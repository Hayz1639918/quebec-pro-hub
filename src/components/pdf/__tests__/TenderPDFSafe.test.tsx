import React from 'react';
import { pdf } from '@react-pdf/renderer';
import TenderPDFSafe, { sanitizePdfText } from '@/components/pdf/TenderPDFSafe';
import type { PartyInfo, TenderProject } from '@/types/tender';

const project: TenderProject = {
  id: '73f2f781-7fad-4b90-bb6a-1366f666736c',
  title: 'Rénovation Salle de bain 🛠️',
  description: "Refaire la salle de bain — douche, céramique et plomberie.",
  category: 'Cuisine et salle de bain',
  project_type: 'Rénovation complète',
  city: 'Repentigny',
  region: 'Lanaudière',
  postal_code: 'J6A 1A1',
  budget_min: 10000,
  budget_max: 25000,
  created_at: '2026-08-19T00:01:58.401553Z',
  tender_number: 'AO-2026-0001',
  submission_deadline: '2026-09-13T04:00:00Z',
  project_start_date: '2026-09-15',
  project_end_date: '2026-10-15',
  technical_specifications: ['Douche vitrée', 'Céramique 24×24'],
  evaluation_criteria: {
    'Prix proposé': 30,
    'Expérience et références': 30,
    'Méthodologie et échéancier': 30,
    'Garanties et assurances': 10,
  },
  required_documents: [
    'Formulaire signé',
    'Licence RBQ',
    "Certificat d'assurance",
  ],
  preferred_entrepreneur_type: 'company',
  required_certifications: ['rbq', 'liability_insurance'],
  payment_mode: 'negotiable',
};

const client: PartyInfo = {
  full_name: 'Client Test',
  email: 'client@example.com',
  phone: '514-555-0101',
};

describe('TenderPDFSafe', () => {
  it('normalizes unsupported PDF glyphs', () => {
    expect(sanitizePdfText('Projet 🛠️ — test □ “ok”')).toBe('Projet  - test - "ok"');
  });

  it('generates a non-empty PDF blob with user-provided unicode text', async () => {
    const blob = await pdf(<TenderPDFSafe project={project} client={client} />).toBlob();

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });
});
