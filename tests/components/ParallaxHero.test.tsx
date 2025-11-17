import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ParallaxHero from '../../src/components/parallaxHero/ParallaxHero';

describe('ParallaxHero', () => {
  it('renders role img and arrow when arrowToId provided', () => {
    const { container, getByLabelText } = render(<ParallaxHero image="/bg.jpg" arrowToId="section1">Hola</ParallaxHero>);
    const section = container.querySelector('[role="img"]');
    expect(section).toBeTruthy();
    const arrow = getByLabelText('Bajar');
    expect(arrow).toBeTruthy();
  });
});
