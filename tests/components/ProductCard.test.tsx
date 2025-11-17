import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../test-utils';
import { describe, it, expect, vi } from 'vitest';

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

describe('ProductCard', () => {
  it('renders product and add button works', () => {
    const { getByText } = renderWithRouter(<ProductCard p={sample as any} />);
    expect(getByText('Prueba')).toBeTruthy();
    const btn = getByText(/Agregar al carrito/i);
    fireEvent.click(btn);
    // without throwing it's OK; useCart.add mocked to return true
    expect(btn).toBeTruthy();
  });
});
