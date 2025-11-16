import { describe, it, expect } from 'vitest';
import { formatCLP } from '../src/utils/currency';

describe('formatCLP', () => {
    it('returns a formatted string for numbers', () => {
        const s = formatCLP(1500);
        expect(typeof s).toBe('string');
        expect(s.length).toBeGreaterThan(0);
    });

    it('returns fallback for null/undefined', () => {
        const a = formatCLP(null);
        const b = formatCLP(undefined);
        expect(a).toBe(b);
    });
});
