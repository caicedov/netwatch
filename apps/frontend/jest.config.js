module.exports = {
  displayName: 'frontend',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.spec.ts', '<rootDir>/**/*.spec.tsx'],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/index.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
