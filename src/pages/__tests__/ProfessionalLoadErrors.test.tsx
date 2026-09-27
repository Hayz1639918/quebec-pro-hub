import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/config';
import ProDashboard from '../ProDashboard';
import ProPayments from '../ProPayments';
import ProInvoices from '../ProInvoices';

const mocks = vi.hoisted(() => ({ profile: vi.fn(), session: vi.fn(), rows: vi.fn() }));
vi.mock('@/components/Navigation', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/InvoicePDF', () => ({ default: () => null }));
vi.mock('@react-pdf/renderer', () => ({ pdf: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: mocks.session },
    from: (table: string) => {
      const query = {
        select: () => query, eq: () => query, in: () => query, is: () => query,
        order: () => query, gte: () => query, limit: () => query,
        single: mocks.profile,
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          mocks.rows(table).then(resolve, reject),
      };
      return query;
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: vi.fn(),
  },
}));

function Location() { return <output aria-label="Current location">{useLocation().pathname}</output>; }

function show(page: React.ReactNode, path = '/pro/dashboard') {
  render(<MemoryRouter initialEntries={[path]}>{page}<Location /></MemoryRouter>);
}

describe('Professional pages load failures', () => {
  beforeEach(() => {
    mocks.profile.mockReset().mockResolvedValue({ data: { user_type: 'professional', profile_completed: true, professional_type: 'entrepreneur', full_name: 'Test' }, error: null });
    mocks.session.mockReset().mockResolvedValue({ data: { session: { user: { id: 'pro' } } }, error: null });
    mocks.rows.mockReset().mockResolvedValue({ data: [], count: 0, error: null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('keeps a profile permission failure on dashboard and retries without asking to log in', async () => {
    mocks.profile.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    show(<ProDashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger votre tableau de bord');
    expect(screen.getByLabelText('Current location')).toHaveTextContent('/pro/dashboard');
    expect(screen.queryByText('0 avis')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('heading', { name: 'Tableau de bord — Entrepreneur' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not show partial dashboard statistics when a data query fails', async () => {
    mocks.rows.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    show(<ProDashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('temporairement indisponibles');
    expect(screen.queryByRole('heading', { name: 'Tableau de bord — Entrepreneur' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Current location')).toHaveTextContent('/pro/dashboard');
  });

  it('still redirects a genuinely absent session to login', async () => {
    mocks.session.mockResolvedValue({ data: { session: null }, error: null });
    show(<ProDashboard />);
    expect(await screen.findByText('/auth', { selector: 'output' })).toBeInTheDocument();
    expect(mocks.profile).not.toHaveBeenCalled();
  });

  it.each([
    ['payments', ProPayments, 'Aucun paiement dans cette catégorie'],
    ['invoices', ProInvoices, null],
  ] as const)('shows %s query errors instead of zero financial totals', async (route, Page, emptyText) => {
    mocks.rows.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
    show(<Page />, `/pro/${route}`);
    expect(await screen.findByRole('alert')).toHaveTextContent('temporairement indisponibles');
    expect(screen.getByLabelText('Current location')).toHaveTextContent(`/pro/${route}`);
    expect(screen.queryByText('0,00 $')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    if (emptyText) expect(await screen.findByText(emptyText)).toBeInTheDocument();
    else expect(await screen.findByRole('heading', { name: 'Mes factures' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
