import { describe, it, expect } from 'vitest';
import slugify from '../src/utils/slugify';

describe('slugify', () => {
    it('converts spaces to dashes and lowercases', () => {
        expect(slugify('Torta de Chocolate')).toBe('torta-de-chocolate');
    });

    it('removes diacritics and non-alphanumerics', () => {
        expect(slugify('Árbol Ñandú & café')).toBe('arbol-nandu-cafe');
    });
});
