import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests share one real Postgres database and truncate it in beforeEach;
    // running test files in parallel would let one file's truncate wipe another's fixtures.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**', 'src/application/**', 'src/infrastructure/concurrency/**'],
    },
  },
});
