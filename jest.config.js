module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  modulePaths: ['<rootDir>'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json',
    },
    Headers: class MockHeaders {
      append() {}
    },
    Request: class MockRequest {},
  },
}
