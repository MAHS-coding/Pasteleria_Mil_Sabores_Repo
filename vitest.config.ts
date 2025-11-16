import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  environment: 'jsdom',
  include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'tests/**/*.test.tsx', 'tests/**/*.spec.tsx'],
  setupFiles: 'tests/setupTests.ts',
    coverage: {
      // use Istanbul provider for compatibility
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/tests/**', 'src/main.tsx', 'src/vite-env.d.ts']
    }
  },
});
