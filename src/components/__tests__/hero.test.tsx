import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import '@/i18n/config';
import Hero from '@/components/Hero';

describe('Hero', () => {
  it('renders the main landing content', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /trouvez le bon\s+entrepreneur/i })).toBeInTheDocument();
    expect(screen.getAllByText(/entrepreneur/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/professionnels vérifiés pour vos projets/i)).toBeInTheDocument();
  });

  it('shows primary actions and key stats', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /publier un projet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /devenir professionnel/i })).toBeInTheDocument();
    expect(screen.getByText(/2 500\+/i)).toBeInTheDocument();
    expect(screen.getByText(/15 000\+/i)).toBeInTheDocument();
    expect(screen.getByText(/4,8\/5/i)).toBeInTheDocument();
  });
});
