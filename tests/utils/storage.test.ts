import { describe, it, expect, beforeEach } from 'vitest';
import { getJSON, setJSON, remove } from '../../src/utils/storage';

describe('storage helpers', () => {
    beforeEach(() => localStorage.clear());

    it('set and get json', () => {
        setJSON('x', { a: 1 });
        const v = getJSON('x');
        expect(v).toEqual({ a: 1 });
    });

    it('remove key', () => {
        setJSON('y', { b: 2 });
        remove('y');
        expect(getJSON('y')).toBeNull();
    });
});
