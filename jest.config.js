module.exports = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  clearMocks: true,
  modulePaths: ['<rootDir>/src/'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'this-is-just-here-to-not-match-anything-and-make-sure-the-node-modules-are-not-ignored-in-the-transforms',
  ],
  setupFiles: ['<rootDir>/test/setupJest.ts', '<rootDir>/test/fields.ts', '<rootDir>/test/formatters.ts'],
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/test/tsconfig.jest.json',
      // babelConfig: true,
      isolatedModules: true,
    },
  },
}

