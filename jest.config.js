module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  modulePaths: ['<rootDir>'],
  // setupFiles: ['<rootDir>/test-utils/registerRequireContext.js'],
  // globals: {
  //   'ts-jest': {
      // tsConfig: '<rootDir>/test-utils/tsconfig.jest.json',
      // babelConfig: true,
      // isolatedModules: true,
    // },
  // },
};
