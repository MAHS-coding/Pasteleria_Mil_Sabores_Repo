import { describe, it, expect } from 'vitest';
import { mapSegmentToId, mapIdToSegment, filterProducts, sortProducts, isPersonalizable } from '../../src/utils/products';

describe('products utils', () => {
    it('maps segments and ids', () => {
        expect(mapSegmentToId('sin-azucar')).toBe('productos-sin-azucar');
        expect(mapIdToSegment('productos-sin-gluten')).toBe('sin-gluten');
    });

    it('filters and sorts', () => {
        const p = [{ code: 'a', category: 'c1', price: 200 }, { code: 'b', category: 'c2', price: 100 }];
        expect(filterProducts(p as any, 'c2').length).toBe(1);
        const sorted = sortProducts(p as any, 'price-asc');
        expect(sorted[0].price).toBe(100);
    });

    it('personalizable codes', () => {
        expect(isPersonalizable('TC001')).toBe(true);
        expect(isPersonalizable('XYZ')).toBe(false);
    });
});
