// Fetch with Timeout Utility
// Uses AbortController to cancel requests that exceed the specified timeout

export interface FetchWithTimeoutOptions extends RequestInit {
    timeout?: number;
}

export class TimeoutError extends Error {
    constructor(message: string = 'Request timed out') {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * Performs a fetch request with an optional timeout using AbortController
 * @param url - The URL to fetch
 * @param options - Fetch options including optional timeout in milliseconds
 * @returns Promise resolving to the fetch Response
 * @throws TimeoutError if the request exceeds the timeout duration
 */
export async function fetchWithTimeout(
    url: string | URL,
    options: FetchWithTimeoutOptions = {}
): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options;

    const controller = new AbortController();
    const { signal } = controller;

    // Create timeout that will abort the request
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal,
        });
        return response;
    } catch (error) {
        // Check if the error was caused by abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
            throw new TimeoutError(`Request to ${url} timed out after ${timeout}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Performs a fetch request with timeout and returns JSON response
 * @param url - The URL to fetch
 * @param options - Fetch options including optional timeout in milliseconds
 * @returns Promise resolving to the parsed JSON response
 * @throws TimeoutError if the request exceeds the timeout duration
 */
export async function fetchJsonWithTimeout<T = unknown>(
    url: string | URL,
    options: FetchWithTimeoutOptions = {}
): Promise<T> {
    const response = await fetchWithTimeout(url, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
}
