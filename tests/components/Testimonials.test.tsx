import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Ensure the component's data loading yields no items for this test
vi.mock('../../src/utils/dataLoaders', () => ({ products: [] }));
vi.mock('../../src/utils/ratings', () => ({ getRatings: () => [] }));

import Testimonials from '../../src/components/home/Testimonials';

describe('Testimonials', () => {
  it('renders fallback when no items', () => {
    const { getByText } = render(<Testimonials />);
    expect(getByText('Aún no hay reseñas destacadas.')).toBeTruthy();
  });
});
