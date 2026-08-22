const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  // API route handlers run on the server, so `node` is the correct default.
  // Browser-facing modules (hooks, react-query, analytics) opt in per-file with
  // a `@jest-environment jsdom` docblock.
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Reset call history between tests so suites can't leak assertions into each
  // other. Implementations set via mockResolvedValue are preserved.
  clearMocks: true,

  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.ts',
    'middleware.ts',
    '!**/__tests__/**',
    '!lib/types/**',
    '!**/*.d.ts',
  ],

  // A ratchet, not a target: set just below current coverage so a regression
  // fails CI while normal work doesn't trip it. Raise these as coverage grows.
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 92,
    },
  },
})
