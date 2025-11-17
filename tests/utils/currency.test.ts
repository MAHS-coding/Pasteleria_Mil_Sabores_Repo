import { describe, it, expect, beforeEach } from 'vitest';
import { formatCLP } from '../../src/utils/currency';

describe('currency.formatCLP', () => {
    it('formats numbers as CLP', () => {
        const s = formatCLP(1500);
        expect(typeof s).toBe('string');
        // Should start with a currency symbol like $ and contain digits
        expect(s).toMatch(/^\$\d/);
    });

    it('returns fallback for invalid', () => {
        const s = formatCLP(NaN);
        expect(typeof s).toBe('string');
    });
});
