import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../test-utils';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/context/CartContext', () => ({
  useCart: () => ({ items: [], count: 0, setQuantity: () => {}, remove: () => {}, clear: () => {} })
}));

import CarritoFlotante from '../../src/components/cart/CarritoFlotante';

describe('CarritoFlotante', () => {
  it('renders empty cart and button opens it', () => {
    const { getByLabelText, getByText } = renderWithRouter(<CarritoFlotante />);
    const openBtn = getByLabelText('Abrir carrito');
    expect(openBtn).toBeTruthy();
    fireEvent.click(openBtn);
    expect(getByText('Tu carrito está vacío')).toBeTruthy();
  });
});
