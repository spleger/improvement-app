const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
});

// Add any custom config to be passed to Jest
const config = {
    coverageProvider: 'v8',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx',
    ],
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/.auto-claude/',
    ],
    collectCoverageFrom: [
        'lib/**/*.ts',
        'app/api/**/*.ts',
        '!**/*.d.ts',
    ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config);
