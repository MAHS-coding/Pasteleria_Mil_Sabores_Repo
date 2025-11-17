import { describe, it, expect } from 'vitest';
import { sha256Hex } from '../../src/utils/hash';

describe('sha256Hex', () => {
    it('computes sha256 hex string', async () => {
        const h = await sha256Hex('test');
        expect(typeof h).toBe('string');
        expect(h.length).toBe(64);
    });
});
