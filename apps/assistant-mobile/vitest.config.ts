import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // only run type tests
    include: ['**/*.test-d.ts'],
  },
});
