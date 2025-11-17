import { describe, it, expect } from 'vitest';
import slugify from '../../src/utils/slugify';

describe('slugify', () => {
    it('converts text to slug', () => {
        expect(slugify('Hola Mundo')).toBe('hola-mundo');
        expect(slugify('ÁÉÍÓÚ ñ')).toBe('aeiou-n');
    });
});
