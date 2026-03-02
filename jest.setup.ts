import '@testing-library/jest-dom';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.OPENAI_API_KEY = 'test-openai-key-for-testing-only';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key-for-testing-only';

// Global test timeout
jest.setTimeout(30000);
