import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['utils/**/*.js', 'components/**/*.vue']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  }
});
