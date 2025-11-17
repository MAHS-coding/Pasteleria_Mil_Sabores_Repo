import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PersonalizeMessageModal from '../../src/components/product/PersonalizeMessageModal';

describe('PersonalizeMessageModal', () => {
  it('renders and calls handlers', () => {
    const onChange = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByPlaceholderText, getByText } = render(
      <PersonalizeMessageModal show={true} productName="Torta" value="" onChange={onChange} onConfirm={onConfirm} onCancel={onCancel} />
    );

    const input = getByPlaceholderText('Ej: ¡Feliz Cumpleaños, Ana! (opcional)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hola' } });
    expect(onChange).toHaveBeenCalled();

    // confirm button is in modal footer
    const btn = getByText('Agregar al carrito');
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalled();
  });
});
