import { describe, it, expect } from 'vitest';
import { isDuocEmail, isBirthdayToday } from '../../src/utils/registro';

describe('registro utils', () => {
    it('detects duoc emails', () => {
        expect(isDuocEmail('usuario@duoc.cl')).toBe(true);
        expect(isDuocEmail('otro@gmail.com')).toBe(false);
    });

    it('birthday check works', () => {
        const today = new Date();
        const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        expect(isBirthdayToday(iso)).toBe(true);
    });
});
