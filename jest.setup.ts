import '@testing-library/jest-dom';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Global test timeout
jest.setTimeout(30000);
