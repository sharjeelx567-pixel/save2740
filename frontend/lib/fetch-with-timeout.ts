/**
 * Request Timeout Wrapper
 * Automatically adds timeout to fetch requests and cancels them if they take too long
 * Prevents hanging requests from blocking the UI
 */

import { API } from '@/lib/constants';

export interface FetchWithTimeoutOptions extends RequestInit {
    timeout?: number;
}

/**
 * Fetch with automatic timeout
 * @param url - URL to fetch
 * @param options - Fetch options with optional timeout (default: 30s from constants)
 * @returns Promise<Response>
 */
export async function fetchWithTimeout(
    url: string,
    options: FetchWithTimeoutOptions = {}
): Promise<Response> {
    const { timeout = API.TIMEOUT, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
    }
}

/**
 * Fetch with retry logic
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries (default: 1)
 * @returns Promise<Response>
 */
export async function fetchWithRetry(
    url: string,
    options: FetchWithTimeoutOptions = {},
    retries: number = 1
): Promise<Response> {
    try {
        return await fetchWithTimeout(url, options);
    } catch (error) {
        if (retries > 0) {
            // Wait briefly before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

/**
 * Example usage:
 * 
 * // Basic timeout:
 * const response = await fetchWithTimeout('/api/data', {
 *   method: 'GET',
 *   timeout: 5000 // 5 seconds
 * });
 * 
 * // With retry:
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 *   timeout: 10000
 * }, 2); // Retry twice
 */
