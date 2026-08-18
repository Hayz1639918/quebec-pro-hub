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
        name: /Trouvez le bon professionnel pour votre projet/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/La construction, mieux organisée/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Publiez votre besoin, découvrez des professionnels au Québec et gardez vos échanges et vos contrats au même endroit/i),
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
