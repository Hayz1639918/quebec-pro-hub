import { parseProfessionalServices } from '@/lib/professional-services';

describe('Professional services display', () => {
  it('displays JSON array values without JSON punctuation and preserves commas inside labels', () => {
    expect(parseProfessionalServices('["Plomberie", "Cuisine, salle de bain", "Électricité"]'))
      .toEqual(['Plomberie', 'Cuisine, salle de bain', 'Électricité']);
  });

  it('continues to support comma-separated legacy profiles', () => {
    expect(parseProfessionalServices(' Plomberie, Électricité, , Peinture '))
      .toEqual(['Plomberie', 'Électricité', 'Peinture']);
  });

  it('normalizes native arrays and ignores non-string entries', () => {
    expect(parseProfessionalServices([' Peinture ', null, 42, {}, '']))
      .toEqual(['Peinture']);
  });

  it.each([null, undefined, '', '[]', '["Plomberie"', {}])('does not display malformed or empty data: %s', (value) => {
    expect(parseProfessionalServices(value)).toEqual([]);
  });
});
