import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithRouter } from '../test-utils';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as any),
        useNavigate: () => vi.fn(),
    };
});

// Mock useCart
vi.mock('../../src/context/CartContext', () => ({
    useCart: () => ({ add: (it: any) => true })
}));

import ProductCard from '../../src/components/product/ProductCard';

const sample = { code: 'P1', productName: 'Prueba', price: 1000, img: '/x.png', stock: 5, category: 'todos' };

describe('ProductCard snapshot', () => {
    it('coincide con el snapshot básico', () => {
        const { asFragment } = renderWithRouter(<ProductCard p={sample as any} />);
        expect(asFragment()).toMatchSnapshot();
    });
});
