import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({ user: { name: 'Prueba', email: 'a@b.com' }, login: () => { }, logout: () => { } })
}));

import Header from '../../src/components/header/Header';
import { MemoryRouter } from 'react-router-dom';

describe('Header snapshot', () => {
    it('coincide con el snapshot cuando el usuario está logueado', () => {
        const { asFragment } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
        expect(asFragment()).toMatchSnapshot();
    });
});
