import React from 'react';
import { render } from '@testing-library/react';
import { renderWithRouter } from '../test-utils';
import { describe, it, expect } from 'vitest';
import FormField from '../../src/components/ui/FormField';

describe('FormField', () => {
    it('renders label with required marker and links to child input', () => {
        const { getByLabelText, getByText } = renderWithRouter(
            <FormField id="f1" label="Nombre" required>
                <input id="f1" />
            </FormField>
        );

        // label including required star
        expect(getByText('Nombre *')).toBeTruthy();
        // input associated with label
        expect(getByLabelText('Nombre *')).toBeTruthy();
    });

    it('renders help text when provided', () => {
        const { getByText } = renderWithRouter(
            <FormField label="Email" help="Ingresa tu correo">
                <input />
            </FormField>
        );

        expect(getByText('Ingresa tu correo')).toBeTruthy();
    });

    it('renders error using FieldFeedback when error prop is present', () => {
        const { getByText } = renderWithRouter(
            <FormField label="Clave" error="Campo obligatorio">
                <input />
            </FormField>
        );

        expect(getByText('Campo obligatorio')).toBeTruthy();
    });

    it('renders feedback when provided and no error', () => {
        const { getByText } = renderWithRouter(
            <FormField label="Nota" feedback={<span>Ayuda extra</span>}>
                <input />
            </FormField>
        );

        expect(getByText('Ayuda extra')).toBeTruthy();
    });
});
