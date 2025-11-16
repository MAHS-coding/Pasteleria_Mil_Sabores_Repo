# Tests

This folder contains example unit tests using Vitest.

Setup

1. Install dev dependencies (if not already installed):

   npm install

2. Run tests once:

   npm run test

3. Run tests in watch mode:

   npm run test:watch

4. Run tests with coverage:

   npm run test:coverage

After coverage runs you'll find reports in the `coverage/` folder. The LCOV report can be opened in many tools (and `coverage/index.html` if your reporter writes HTML).

Notes

- The repository includes a Vitest config that generates `text` and `lcov` coverage reports by default.
- If you want DOM/component coverage, change `environment` in `vitest.config.ts` to `jsdom` and add `@testing-library/react`.
- Example tests cover services and utilities to help you get started.
