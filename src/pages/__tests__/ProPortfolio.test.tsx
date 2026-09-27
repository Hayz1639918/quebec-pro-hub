import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProPortfolio from '../ProPortfolio';

const mocks = vi.hoisted(() => ({
  from: vi.fn(), update: vi.fn(), toast: vi.fn(), storage: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'pro-1' } } } }) },
  from: mocks.from,
  storage: { from: mocks.storage },
} }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/components/Navigation', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

const item = {
  id: 'portfolio-1', professional_id: 'pro-1', title: 'Salle de bain',
  description: 'Rénovation', image_url: 'https://example.com/bathroom.png',
  project_date: null, category: 'Plomberie', created_at: '2026-09-27',
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.update.mockReturnValue({ eq: async () => ({ error: null }) });
  mocks.from.mockImplementation((table: string) => {
    if (table === 'profiles') return { select: () => ({ eq: () => ({ single: async () => ({ data: { user_type: 'professional' } }) }) }) };
    if (table === 'portfolio_items') return {
      select: () => ({ eq: () => ({ order: async () => ({ data: [item], error: null }) }) }),
      update: mocks.update,
    };
    throw new Error(`Unexpected table: ${table}`);
  });
});
afterEach(cleanup);

it('persists explicit photo removal without deleting shared storage objects', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><ProPortfolio /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Modifier Salle de bain' }));
  await user.click(screen.getByRole('button', { name: 'Retirer la photo sélectionnée' }));
  await user.click(screen.getByRole('button', { name: 'Mettre à jour' }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ image_url: null, title: 'Salle de bain' })));
  expect(mocks.storage).not.toHaveBeenCalled();
});

it('keeps the existing photo when another detail is edited', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><ProPortfolio /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Modifier Salle de bain' }));
  await user.clear(screen.getByLabelText('Titre du projet *'));
  await user.type(screen.getByLabelText('Titre du projet *'), 'Salle de bain rénovée');
  await user.click(screen.getByRole('button', { name: 'Mettre à jour' }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ image_url: item.image_url, title: 'Salle de bain rénovée' })));
  expect(mocks.storage).not.toHaveBeenCalled();
});
