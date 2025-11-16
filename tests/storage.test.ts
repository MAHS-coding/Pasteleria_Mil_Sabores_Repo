import { describe, it, expect, beforeEach } from 'vitest';
import { getJSON, setJSON, remove } from '../src/utils/storage';

describe('storage helpers', () => {
    beforeEach(() => {
        // provide a minimal localStorage mock for node environment
        (globalThis as any).localStorage = (() => {
            let store: Record<string, string> = {};
            return {
                getItem(key: string) { return store[key] ?? null; },
                setItem(key: string, value: string) { store[key] = String(value); },
                removeItem(key: string) { delete store[key]; },
                clear() { store = {}; }
            } as Storage;
        })();
    });

    it('setJSON and getJSON roundtrip an object', () => {
        setJSON('x', { a: 1, b: 'ok' });
        const v = getJSON<{ a: number; b: string }>('x');
        expect(v).toEqual({ a: 1, b: 'ok' });
    });

    it('remove deletes the key and getJSON returns null', () => {
        setJSON('temp', { foo: 'bar' });
        remove('temp');
        expect(getJSON('temp')).toBeNull();
    });
});
