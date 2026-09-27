import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClientPayments from '../ClientPayments';

const mocks = vi.hoisted(() => ({ payments: vi.fn(), profile: vi.fn() }));
vi.mock('@/components/Navigation', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'client' } } }, error: null }) },
    from: (table: string) => ({
      select: () => ({ eq: () => table === 'profiles'
        ? { single: mocks.profile }
        : { order: mocks.payments } }),
    }),
  },
}));

describe('ClientPayments unavailable data', () => {
  beforeEach(() => {
    mocks.profile.mockResolvedValue({ data: { user_type: 'client' }, error: null });
    mocks.payments.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('keeps permission errors visible without zero totals, then retries successfully', async () => {
    mocks.payments.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'permission denied' } })
      .mockResolvedValueOnce({ data: [], error: null });
    render(<MemoryRouter><ClientPayments /></MemoryRouter>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger vos paiements');
    expect(screen.queryByText('Aucun paiement dans cette catégorie')).not.toBeInTheDocument();
    expect(screen.queryByText('À régler / confirmer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('Aucun paiement dans cette catégorie')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.payments).toHaveBeenCalledTimes(2);
  });

  it('recovers from an unexpected network rejection rather than keeping the skeleton forever', async () => {
    mocks.payments.mockRejectedValueOnce(new Error('network unavailable'));
    render(<MemoryRouter><ClientPayments /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger vos paiements');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Réessayer' })).toBeEnabled());
  });
});
