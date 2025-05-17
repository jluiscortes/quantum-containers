module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',             // Only collect coverage from src directory
    '!src/**/*.module.ts',         // Exclude module files
    '!src/main.ts',                // Exclude main entry point
    '!src/**/*.dto.ts',            // Optional: exclude DTOs
    '!src/**/*.interface.ts',      // Optional: exclude interfaces
    '!src/**/*.constants.ts',      // Optional: exclude constants
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};