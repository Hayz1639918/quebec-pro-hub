import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedProRoute from '../ProtectedProRoute';

const mocks = vi.hoisted(() => ({ session: vi.fn(), profile: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mocks.session } } }));
vi.mock('@/services/profile-service', () => ({ getMyProfile: mocks.profile }));

function renderRoute() {
  return render(<MemoryRouter initialEntries={['/pro/dashboard']}><Routes>
    <Route element={<ProtectedProRoute />}><Route path="/pro/dashboard" element={<p>Protected workspace</p>} /></Route>
    <Route path="/auth" element={<p>Login page</p>} />
    <Route path="/dashboard" element={<p>Client dashboard</p>} />
  </Routes></MemoryRouter>);
}

describe('professional route access during outages', () => {
  beforeEach(() => {
    mocks.session.mockReset().mockResolvedValue({ data: { session: { user: { id: 'pro' } } }, error: null });
    mocks.profile.mockReset();
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('keeps protected content closed on profile failure and recovers without login', async () => {
    mocks.profile.mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ id: 'pro', user_type: 'professional' });
    renderRoute();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('Protected workspace')).toBeInTheDocument();
  });

  it('still rejects a client account and sends an absent session to login', async () => {
    mocks.profile.mockResolvedValue({ id: 'pro', user_type: 'client' });
    const view = renderRoute();
    expect(await screen.findByText('Client dashboard')).toBeInTheDocument();
    view.unmount();
    mocks.session.mockResolvedValue({ data: { session: null }, error: null });
    renderRoute();
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('ignores a late profile result after timeout until explicitly retried', async () => {
    vi.useFakeTimers();
    let resolveProfile!: (value: unknown) => void;
    mocks.profile.mockReturnValue(new Promise(resolve => { resolveProfile = resolve; }));
    renderRoute();
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await act(async () => { resolveProfile({ id: 'pro', user_type: 'professional' }); });
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
