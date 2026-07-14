import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'src/**/*.test.ts',
      'packages/*/src/**/*.test.ts',
      'cli/**/*.test.ts',
      'tests/**/*.test.ts'
    ],
    exclude: ['**/node_modules/**', '**/dist/**']
  }
})
