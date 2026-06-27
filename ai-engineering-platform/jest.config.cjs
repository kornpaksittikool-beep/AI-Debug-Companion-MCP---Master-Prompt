module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/unit'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        diagnostics: {
          ignoreCodes: [151002]
        }
      }
    ]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: 'coverage'
};
