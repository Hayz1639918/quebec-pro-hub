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

    expect(screen.getByText(/Trouvez les/i)).toBeInTheDocument();
    expect(screen.getByText(/meilleurs/i)).toBeInTheDocument();
    expect(screen.getAllByText(/entrepreneurs/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Plateforme internationale sécurisée/i)).toBeInTheDocument();
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
    expect(screen.getByText(/15K\+/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.8\/5/i)).toBeInTheDocument();
  });
});
