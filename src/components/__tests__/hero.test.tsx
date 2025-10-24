import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import '@/i18n/config';
import Hero from '@/components/Hero';

describe('Hero', () => {
  it('renders main headline', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Connectez-vous/i)
    ).toBeInTheDocument();
  });

  it('shows key stats', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    );
    expect(screen.getByText(/Connectez-vous/i)).toBeInTheDocument();
    expect(screen.getByText(/Connectez-vous/i)).toBeInTheDocument();
    expect(screen.getByText(/Connectez-vous/i)).toBeInTheDocument();
  });
});

