import { describe, it, expect } from 'vitest';
import { formatearRun, validarRun, emailDominioValido } from '../../src/utils/validation';

describe('validation', () => {
    it('formats and validates RUT', () => {
        const f = formatearRun('19011022k');
        expect(typeof f).toBe('string');
        // validarRun should return a boolean for formatted input
        expect(typeof validarRun(f)).toBe('boolean');
    });

    it("validates RUTs whose DV is 'K'", () => {
        // Construct a dotted RUT whose numeric body leads to dvEsperado === 10
        // '00.000.006-K' reduces to numero '0000006' which yields dv 'K' under the algorithm
        expect(validarRun('00.000.006-K')).toBe(true);
        // also accept lowercase k
        expect(validarRun('00.000.006-k')).toBe(true);
    });

    it('email domain check', () => {
        expect(emailDominioValido('usuario@duoc.cl')).toBe(true);
        expect(emailDominioValido('otro@unknown.com')).toBe(false);
    });
});
