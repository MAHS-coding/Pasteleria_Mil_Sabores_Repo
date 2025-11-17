import { describe, it, expect } from 'vitest';
import { formatCardNumber, sanitizeCardNumber, detectBrand, maskLast4 } from '../../src/utils/cardUtils';

describe('cardUtils', () => {
    it('formats and sanitizes card numbers', () => {
        expect(formatCardNumber('4242424242424242')).toContain('4242');
        expect(sanitizeCardNumber('4242 4242')).toBe('42424242');
    });

    it('detects brand and masks last4', () => {
        expect(detectBrand('4242')).toBe('Visa');
        expect(detectBrand('511111')).toBe('Mastercard');
        expect(maskLast4('1234 5678 9012')).toBe('9012');
    });
});
