import { describe, it, expect } from 'vitest';
import { STOCK_INSUFICIENTE_TITLE, stockLimitAdjusted, CANTIDAD_AJUSTADA_TITLE, soloQuedanUnidades } from '../../src/utils/messages';

describe('messages', () => {
    it('has constants and functions', () => {
        expect(STOCK_INSUFICIENTE_TITLE).toBeTruthy();
        expect(stockLimitAdjusted(2)).toContain('2');
        expect(soloQuedanUnidades(1)).toContain('unidad');
    });
});
