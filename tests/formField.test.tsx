import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { FormField } from '../src/components/ui/FormField';

describe('FormField component', () => {
  test('renders label and children and error text', () => {
    const label = 'Nombre';
    const id = 'nombre';
    render(
      <FormField id={id} label={label} error="Error test">
        <input name="nombre" />
      </FormField>
    );

    // label present
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    // input present
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    // error shown
    expect(screen.getByText('Error test')).toBeInTheDocument();
  });
});
