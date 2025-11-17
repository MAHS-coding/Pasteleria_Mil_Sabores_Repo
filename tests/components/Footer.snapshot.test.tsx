import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// mock useAuth to return no user for a stable snapshot
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({ user: null })
}));

import Footer from '../../src/components/footer/Footer';
import { MemoryRouter } from 'react-router-dom';

describe('Footer snapshot', () => {
    it('coincide con el snapshot cuando no hay usuario', () => {
        const { asFragment } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );
        expect(asFragment()).toMatchSnapshot();
    });
});
