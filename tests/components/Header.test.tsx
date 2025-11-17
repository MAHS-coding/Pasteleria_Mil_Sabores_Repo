import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Prueba', email: 'a@b.com' }, login: () => {}, logout: () => {} })
}));

import Header from '../../src/components/header/Header';
import { MemoryRouter } from 'react-router-dom';

describe('Header', () => {
  it('renders brand image and user name when logged', () => {
    const { getByAltText, getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(getByAltText('Pastelería Mil Sabores')).toBeTruthy();
    expect(getByText('Prueba')).toBeTruthy();
  });
});
