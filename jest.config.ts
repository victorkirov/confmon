module.exports = {
  roots: ['<rootDir>/src'],
  transform: { '^.+\\.ts?$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.ts'],
  testRegex: '/src/.*\\.(test|Test)?\\.(ts)$',
  moduleFileExtensions: ['js', 'ts'],
  coverageReporters: ['json', 'html'],
  setupFilesAfterEnv: ['jest-extended'],
}
