import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

type Options = RenderOptions & { route?: string };

export function renderWithRouter(ui: ReactElement, options: Options = {}) {
  const { route = '/', ...rest } = options;
  return rtlRender(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, rest);
}

export default { renderWithRouter };
