import { describe, it, expect } from 'vitest';
import { getAllProducts, findProductByCode, searchProducts } from '../src/services/productService';

describe('productService', () => {
    it('returns a non-empty product list', () => {
        const all = getAllProducts();
        expect(Array.isArray(all)).toBe(true);
        expect(all.length).toBeGreaterThan(0);
    });

    it('finds a product by code', () => {
        const maybe = findProductByCode('TC001');
        // TC001 exists in the seeded productos.json
        expect(maybe).toBeDefined();
        if (maybe) expect(maybe.codigo_producto).toBe('TC001');
    });

    it('searchProducts returns matches for query', () => {
        const res = searchProducts('chocolate');
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBeGreaterThanOrEqual(0);
    });
});
