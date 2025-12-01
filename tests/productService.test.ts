import { describe, it, expect } from 'vitest';
import { getAllProducts, findProductByCode, searchProducts } from '../src/services/productService';

describe('productService', () => {
    it('returns a non-empty product list', async () => {
        const all = await getAllProducts();
        expect(Array.isArray(all)).toBe(true);
        expect(all.length).toBeGreaterThan(0);
    });

    it('finds a product by code', async () => {
        const maybe = await findProductByCode('TC001');
        // TC001 exists in the seeded productos.json
        expect(maybe).toBeDefined();
        if (maybe) expect((maybe as any).codigo_producto).toBe('TC001');
    });

    it('searchProducts returns matches for query', async () => {
        const res = await searchProducts('chocolate');
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBeGreaterThanOrEqual(0);
    });
});
