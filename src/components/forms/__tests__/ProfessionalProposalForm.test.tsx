import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfessionalProposalForm from '../ProfessionalProposalForm';

const mocks = vi.hoisted(() => ({
  from: vi.fn(), insert: vi.fn(), success: vi.fn(), error: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation((table: string) => {
    if (table !== 'proposals') throw new Error(`Unexpected table access: ${table}`);
    return { insert: mocks.insert };
  });
});
afterEach(cleanup);

const setup = () => {
  const onSuccess = vi.fn();
  render(<MemoryRouter><ProfessionalProposalForm projectId="project-1" professionalId="pro-1" onSuccess={onSuccess} /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Message de présentation *'), { target: { value: 'Travaux de rénovation proposés' } });
  fireEvent.change(screen.getByLabelText('Budget estimé (CAD) *'), { target: { value: '7500' } });
  fireEvent.change(screen.getByLabelText('Durée estimée (jours) *'), { target: { value: '10' } });
  return { onSuccess };
};

describe('Professional proposal submission', () => {
  it('writes a proposal once and relies on the database notification, even during repeated submits', async () => {
    let finish!: (result: { error: null }) => void;
    mocks.insert.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { onSuccess } = setup();
    const form = screen.getByRole('button', { name: 'Envoyer la soumission' }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Envoi en cours...' })).toBeDisabled();
    finish({ error: null });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(mocks.success).toHaveBeenCalledTimes(1);
    expect(mocks.error).not.toHaveBeenCalled();
    expect(mocks.from.mock.calls).toEqual([['proposals']]);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      project_id: 'project-1', professional_id: 'pro-1', estimated_budget: 7500,
      estimated_duration_days: 10, status: 'pending',
    }));
  });

  it('does not announce success after an insert error and allows retry', async () => {
    mocks.insert.mockResolvedValueOnce({ error: { code: '23505' } }).mockResolvedValueOnce({ error: null });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onSuccess } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la soumission' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Vous avez déjà soumis une proposition pour ce projet'));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la soumission' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    consoleError.mockRestore();
  });

  it('exposes labels for repeated team fields and removal actions', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Équipe' }));
    expect(screen.getByRole('textbox', { name: /^Nom$/ })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Rôle' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ajouter un membre' }));
    expect(screen.getAllByRole('textbox', { name: /^Nom$/ })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Supprimer le membre 2' }));
    expect(screen.getAllByRole('textbox', { name: /^Nom$/ })).toHaveLength(1);
  });
});
