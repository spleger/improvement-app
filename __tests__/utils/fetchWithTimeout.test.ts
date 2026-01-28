/**
 * Unit Tests for lib/utils/fetchWithTimeout.ts
 * Tests fetch operations with timeout using AbortController
 */

import {
    fetchWithTimeout,
    fetchJsonWithTimeout,
    TimeoutError,
    FetchWithTimeoutOptions,
} from '@/lib/utils/fetchWithTimeout';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbort = jest.fn();
const mockAbortController = {
    abort: mockAbort,
    signal: { aborted: false },
};

// Store original AbortController
const OriginalAbortController = global.AbortController;

// Spies for timer functions
let setTimeoutSpy: jest.SpyInstance;
let clearTimeoutSpy: jest.SpyInstance;

describe('lib/utils/fetchWithTimeout.ts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Spy on timer functions
        setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        // Reset AbortController mock
        global.AbortController = jest.fn(() => mockAbortController) as unknown as typeof AbortController;
    });

    afterEach(() => {
        jest.useRealTimers();
        global.AbortController = OriginalAbortController;
        setTimeoutSpy.mockRestore();
        clearTimeoutSpy.mockRestore();
    });

    describe('TimeoutError', () => {
        it('should create a TimeoutError with default message', () => {
            const error = new TimeoutError();

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(TimeoutError);
            expect(error.name).toBe('TimeoutError');
            expect(error.message).toBe('Request timed out');
        });

        it('should create a TimeoutError with custom message', () => {
            const customMessage = 'Custom timeout message';
            const error = new TimeoutError(customMessage);

            expect(error.name).toBe('TimeoutError');
            expect(error.message).toBe(customMessage);
        });
    });

    describe('fetchWithTimeout', () => {
        it('should successfully fetch and return response', async () => {
            const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
            mockFetch.mockResolvedValueOnce(mockResponse);

            const responsePromise = fetchWithTimeout('https://api.example.com/data');
            jest.runAllTimers();
            const response = await responsePromise;

            expect(response).toBe(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
                signal: mockAbortController.signal,
            });
        });

        it('should use default timeout of 30000ms', async () => {
            const mockResponse = new Response('OK');
            mockFetch.mockResolvedValueOnce(mockResponse);

            const responsePromise = fetchWithTimeout('https://api.example.com/data');

            // Verify setTimeout was called with 30000ms
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

            jest.runAllTimers();
            await responsePromise;
        });

        it('should use custom timeout when provided', async () => {
            const mockResponse = new Response('OK');
            mockFetch.mockResolvedValueOnce(mockResponse);

            const responsePromise = fetchWithTimeout('https://api.example.com/data', {
                timeout: 5000,
            });

            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);

            jest.runAllTimers();
            await responsePromise;
        });

        it('should pass through fetch options', async () => {
            const mockResponse = new Response('OK');
            mockFetch.mockResolvedValueOnce(mockResponse);

            const options: FetchWithTimeoutOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'data' }),
                timeout: 10000,
            };

            const responsePromise = fetchWithTimeout('https://api.example.com/data', options);
            jest.runAllTimers();
            await responsePromise;

            expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'data' }),
                signal: mockAbortController.signal,
            });
        });

        it('should throw TimeoutError when request times out', async () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            mockFetch.mockRejectedValueOnce(abortError);

            const responsePromise = fetchWithTimeout('https://api.example.com/data', {
                timeout: 5000,
            });

            await expect(responsePromise).rejects.toThrow(TimeoutError);
            await expect(responsePromise).rejects.toThrow(
                'Request to https://api.example.com/data timed out after 5000ms'
            );
        });

        it('should re-throw non-abort errors', async () => {
            const networkError = new Error('Network error');
            mockFetch.mockRejectedValueOnce(networkError);

            const responsePromise = fetchWithTimeout('https://api.example.com/data');
            jest.runAllTimers();

            await expect(responsePromise).rejects.toThrow('Network error');
            await expect(responsePromise).rejects.not.toBeInstanceOf(TimeoutError);
        });

        it('should clear timeout on successful response', async () => {
            const mockResponse = new Response('OK');
            mockFetch.mockResolvedValueOnce(mockResponse);

            const responsePromise = fetchWithTimeout('https://api.example.com/data');
            jest.runAllTimers();
            await responsePromise;

            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it('should clear timeout on error', async () => {
            const networkError = new Error('Network error');
            mockFetch.mockRejectedValueOnce(networkError);

            const responsePromise = fetchWithTimeout('https://api.example.com/data');
            jest.runAllTimers();

            try {
                await responsePromise;
            } catch {
                // Expected to throw
            }

            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it('should accept URL object', async () => {
            const mockResponse = new Response('OK');
            mockFetch.mockResolvedValueOnce(mockResponse);

            const url = new URL('https://api.example.com/data');
            const responsePromise = fetchWithTimeout(url);
            jest.runAllTimers();
            await responsePromise;

            expect(mockFetch).toHaveBeenCalledWith(url, {
                signal: mockAbortController.signal,
            });
        });
    });

    describe('fetchJsonWithTimeout', () => {
        it('should return parsed JSON on success', async () => {
            const testData = { message: 'Hello', count: 42 };
            const mockResponse = new Response(JSON.stringify(testData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
            mockFetch.mockResolvedValueOnce(mockResponse);

            const dataPromise = fetchJsonWithTimeout<typeof testData>('https://api.example.com/data');
            jest.runAllTimers();
            const data = await dataPromise;

            expect(data).toEqual(testData);
        });

        it('should throw error on non-ok response', async () => {
            const mockResponse = new Response('Not Found', {
                status: 404,
                statusText: 'Not Found',
            });
            mockFetch.mockResolvedValueOnce(mockResponse);

            const dataPromise = fetchJsonWithTimeout('https://api.example.com/data');
            jest.runAllTimers();

            await expect(dataPromise).rejects.toThrow('HTTP error! status: 404');
        });

        it('should throw TimeoutError on timeout', async () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            mockFetch.mockRejectedValueOnce(abortError);

            const dataPromise = fetchJsonWithTimeout('https://api.example.com/data', {
                timeout: 3000,
            });

            await expect(dataPromise).rejects.toThrow(TimeoutError);
        });

        it('should use custom timeout', async () => {
            const mockResponse = new Response(JSON.stringify({ ok: true }), {
                status: 200,
            });
            mockFetch.mockResolvedValueOnce(mockResponse);

            const dataPromise = fetchJsonWithTimeout('https://api.example.com/data', {
                timeout: 15000,
            });

            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 15000);

            jest.runAllTimers();
            await dataPromise;
        });

        it('should pass through fetch options', async () => {
            const mockResponse = new Response(JSON.stringify({ result: 'created' }), {
                status: 201,
            });
            mockFetch.mockResolvedValueOnce(mockResponse);

            const dataPromise = fetchJsonWithTimeout('https://api.example.com/data', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer token123' },
                body: JSON.stringify({ name: 'test' }),
            });
            jest.runAllTimers();
            await dataPromise;

            expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer token123' },
                body: JSON.stringify({ name: 'test' }),
                signal: mockAbortController.signal,
            });
        });

        it('should throw on 500 server error', async () => {
            const mockResponse = new Response('Internal Server Error', {
                status: 500,
            });
            mockFetch.mockResolvedValueOnce(mockResponse);

            const dataPromise = fetchJsonWithTimeout('https://api.example.com/data');
            jest.runAllTimers();

            await expect(dataPromise).rejects.toThrow('HTTP error! status: 500');
        });

        it('should handle typed response', async () => {
            interface UserResponse {
                id: string;
                name: string;
                email: string;
            }

            const userData: UserResponse = {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
            };
            const mockResponse = new Response(JSON.stringify(userData), {
                status: 200,
            });
            mockFetch.mockResolvedValueOnce(mockResponse);

            const dataPromise = fetchJsonWithTimeout<UserResponse>('https://api.example.com/user');
            jest.runAllTimers();
            const data = await dataPromise;

            expect(data.id).toBe('user-123');
            expect(data.name).toBe('Test User');
            expect(data.email).toBe('test@example.com');
        });
    });
});
