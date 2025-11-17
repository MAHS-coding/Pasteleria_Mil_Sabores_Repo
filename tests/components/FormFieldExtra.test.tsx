import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from '../../src/components/ui/FormField';

describe('FormField', () => {
    it('renders label, help and error feedback', () => {
        const { getByText, container } = render(
            <FormField id="f1" label="Etiqueta" help="Pista" error="Error">
                <input id="f1" />
            </FormField>
        );

        expect(getByText('Etiqueta')).toBeTruthy();
        expect(getByText('Pista')).toBeTruthy();
        const err = container.querySelector('.invalid-feedback');
        expect(err?.textContent).toContain('Error');
    });
});
