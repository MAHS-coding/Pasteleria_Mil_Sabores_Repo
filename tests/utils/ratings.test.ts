import { describe, it, expect, beforeEach } from 'vitest';
import { getRatings, addRating, getAverage } from '../../src/utils/ratings';

const KEY = 'product_ratings_v1';

describe('ratings utils', () => {
    beforeEach(() => localStorage.removeItem(KEY));

    it('adds and reads ratings', () => {
        const r = { userEmail: 'a@b.com', stars: 5, comment: 'OK', date: new Date().toISOString() } as any;
        addRating('P1', r);
        const list = getRatings('P1');
        expect(list.length).toBeGreaterThanOrEqual(1);
        const avg = getAverage('P1');
        expect(avg.count).toBeGreaterThanOrEqual(1);
    });
});
