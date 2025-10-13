import { render, screen } from '@testing-library/react';
import React from 'react';
import Hero from '@/components/Hero';

describe('Hero', () => {
  it('renders main headline', () => {
    render(<Hero />);
    expect(
      screen.getByText('Connectez-vous aux meilleurs entrepreneurs du bâtiment')
    ).toBeInTheDocument();
  });

  it('shows key stats', () => {
    render(<Hero />);
    expect(screen.getByText('Entrepreneurs actifs')).toBeInTheDocument();
    expect(screen.getByText('Projets réalisés')).toBeInTheDocument();
    expect(screen.getByText('Note moyenne')).toBeInTheDocument();
  });
});

