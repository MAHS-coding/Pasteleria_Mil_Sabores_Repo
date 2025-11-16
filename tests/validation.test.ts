import { describe, it, expect } from 'vitest';
import { formatearRun, validarRun, emailDominioValido } from '../src/utils/validation';

describe('validation utilities', () => {
    it('formats RUN correctly', () => {
        expect(formatearRun('12345678k')).toBe('12.345.678-K');
    });

    it('validarRun returns false for empty or malformed input', () => {
        expect(validarRun('')).toBe(false);
        expect(validarRun('1234')).toBe(false);
    });

    it('emailDominioValido accepts allowed domains', () => {
        expect(emailDominioValido('usuario@duoc.cl')).toBe(true);
        expect(emailDominioValido('profesor@profesor.duoc.cl')).toBe(true);
    });

    it('emailDominioValido rejects other domains', () => {
        expect(emailDominioValido('user@example.com')).toBe(false);
    });
});
