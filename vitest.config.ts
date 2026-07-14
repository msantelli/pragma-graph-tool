import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@pragma-graph/core': path.resolve(__dirname, 'packages/core/src/index.ts')
    }
  },
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
