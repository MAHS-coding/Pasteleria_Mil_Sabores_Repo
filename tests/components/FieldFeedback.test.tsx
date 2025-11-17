import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FieldFeedback from '../../src/components/ui/FieldFeedback';

describe('FieldFeedback', () => {
  it('renders children and has invalid-feedback class', () => {
    const { container } = render(<FieldFeedback>Mensaje de error</FieldFeedback>);
    const el = container.querySelector('.invalid-feedback');
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('Mensaje de error');
  });
});
