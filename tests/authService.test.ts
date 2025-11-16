import { describe, it, expect } from 'vitest';
import { authenticate } from '../src/services/authService';

describe('authService', () => {
    it('returns undefined for unknown credentials', async () => {
        const maybe = await authenticate('__not_an_email__', 'nope');
        expect(maybe).toBeUndefined();
    });
});
