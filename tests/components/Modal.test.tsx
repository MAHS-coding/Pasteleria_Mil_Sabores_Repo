import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from '../../src/components/ui/Modal';

describe('Modal', () => {
  it('renders title and buttons and calls handlers', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { getByText } = render(
      <Modal show={true} title="Prueba" onClose={onClose} onConfirm={onConfirm} confirmLabel="OK" cancelLabel="NO">
        <div>Contenido</div>
      </Modal>
    );

    expect(getByText('Prueba')).toBeTruthy();
    const ok = getByText('OK');
    const no = getByText('NO');
    fireEvent.click(ok);
    fireEvent.click(no);
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape and restores body overflow on hide', () => {
    const onClose = vi.fn();
    const prev = document.body.style.overflow;
    const { rerender } = render(
      <Modal show={true} title="X" onClose={onClose}>
        <div />
      </Modal>
    );

    // body overflow prevented
    expect(document.body.style.overflow).toBe('hidden');

    // press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    // hide modal to trigger cleanup
    rerender(
      <Modal show={false} title="X" onClose={onClose}>
        <div />
      </Modal>
    );

    expect(document.body.style.overflow).toBe(prev);
  });

  it('does not render footer when hideFooter is true', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { queryByText } = render(
      <Modal show={true} title="NoFooter" onClose={onClose} onConfirm={onConfirm} hideFooter>
        <div>Body</div>
      </Modal>
    );

    expect(queryByText('Cancelar')).toBeNull();
    expect(queryByText('Confirmar')).toBeNull();
  });
});
