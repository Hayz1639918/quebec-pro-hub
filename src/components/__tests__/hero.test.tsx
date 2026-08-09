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

    expect(
      screen.getByRole('heading', {
        name: /Trouvez le bon entrepreneur, en toute confiance/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/La construction en toute confiance/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Des professionnels vérifiés pour vos projets partout au Québec/i),
    ).toBeInTheDocument();
  });

  it('shows primary actions and search selects', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /publier un projet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /trouver un professionnel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechercher/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/type de projet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ville ou région/i)).toBeInTheDocument();
  });
});
