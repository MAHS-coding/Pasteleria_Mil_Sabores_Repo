import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// mock useAuth to return no user
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: null })
}));

import Footer from '../../src/components/footer/Footer';
import { MemoryRouter } from 'react-router-dom';

describe('Footer', () => {
  it('renders legal links and hides Mis pedidos when not logged', () => {
    const { queryByText, getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(getByText('Términos y Condiciones')).toBeTruthy();
    expect(queryByText('Mis pedidos')).toBeNull();
  });
});
