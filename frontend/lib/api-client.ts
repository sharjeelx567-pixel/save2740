/**
 * Centralized API client for all HTTP requests
 * Provides a single point of control for API interactions with consistent error handling
 */

import { API, STORAGE, ERROR_MESSAGES } from "@/lib/constants";
import { ApiErrorResponse, ApiResponse } from "@/lib/types";

/**
 * ApiClient class manages all API communication
 * - Handles authentication headers
 * - Implements request timeout
 * - Provides consistent error handling
 * - Manages logging for debugging
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API.BASE_URL, timeout: number = API.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Get authorization token from localStorage
   */
  private getAuthToken(): string | null {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem(STORAGE.TOKEN)
        : null;
    } catch {
      console.warn("Failed to retrieve auth token");
      return null;
    }
  }

  /**
   * Create request headers with authentication
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    };

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Parse error response from API
   */
  private parseError(error: unknown): ApiErrorResponse {
    // Handle abort/timeout errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        error: 'Request was cancelled or timed out.',
        code: 'ABORT_ERROR',
      };
    }

    if (error instanceof TypeError) {
      if (error.message.includes("fetch")) {
        return {
          error: ERROR_MESSAGES.NETWORK,
          code: "NETWORK_ERROR",
        };
      }
    }

    if (error instanceof Error) {
      return {
        error: error.message,
        code: "UNKNOWN_ERROR",
      };
    }

    return {
      error: ERROR_MESSAGES.SERVER_ERROR,
      code: "UNKNOWN",
    };
  }

  /**
   * Generic GET request
   */
  async get<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options, // Allow custom options but prioritize internal defaults
        method: "GET",
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
        credentials: 'include', // FORCE cookies
        cache: 'no-store', // FORCE no caching
        signal: options?.signal || controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = errorData.code || 'UNKNOWN_ERROR';

        // Handle specific error codes
        if (errorCode === 'SESSION_EXPIRED' || response.status === 401) {
          // Clear auth data and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE.TOKEN);
            localStorage.removeItem('session');
            localStorage.removeItem('user');
            window.location.href = '/session-expired';
          }
        }

        if (errorCode === 'ACCOUNT_LOCKED' || errorCode === 'ACCOUNT_SUSPENDED') {
          // Redirect to account status page
          if (typeof window !== 'undefined') {
            window.location.href = `/account-status?code=${errorCode}`;
          }
        }

        return {
          success: false,
          error: {
            error: errorData.error || ERROR_MESSAGES.SERVER_ERROR,
            code: errorCode,
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      // Silently handle AbortError (expected when components unmount or navigate away)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            error: 'Request cancelled',
            code: 'ABORT_ERROR',
          },
        };
      }

      console.error(`GET ${endpoint} failed:`, error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Generic POST request
   */
  async post<T, D = unknown>(
    endpoint: string,
    body?: D,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options, // Allow custom options but prioritize internal defaults
        method: "POST",
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // FORCE cookies
        cache: 'no-store', // FORCE no caching
        signal: options?.signal || controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = errorData.code || 'UNKNOWN_ERROR';

        // Handle specific error codes
        if (errorCode === 'SESSION_EXPIRED' || response.status === 401) {
          // Clear auth data and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE.TOKEN);
            localStorage.removeItem('session');
            localStorage.removeItem('user');
            window.location.href = '/session-expired';
          }
        }

        if (errorCode === 'ACCOUNT_LOCKED' || errorCode === 'ACCOUNT_SUSPENDED') {
          // Redirect to account status page
          if (typeof window !== 'undefined') {
            window.location.href = `/account-status?code=${errorCode}`;
          }
        }

        return {
          success: false,
          error: {
            error: errorData.error || ERROR_MESSAGES.SERVER_ERROR,
            code: errorCode,
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      // Silently handle AbortError (expected when components unmount or navigate away)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            error: 'Request cancelled',
            code: 'ABORT_ERROR',
          },
        };
      }

      console.error(`POST ${endpoint} failed:`, error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Generic PUT request
   */
  async put<T, D = unknown>(
    endpoint: string,
    body?: D,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options, // Allow custom options but prioritize internal defaults
        method: "PUT",
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // FORCE cookies
        cache: 'no-store', // FORCE no caching
        signal: options?.signal || controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            error: errorData.error || ERROR_MESSAGES.SERVER_ERROR,
            code: errorData.code || 'UNKNOWN_ERROR',
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options, // Allow custom options but prioritize internal defaults
        method: "DELETE",
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
        credentials: 'include', // FORCE cookies
        cache: 'no-store', // FORCE no caching
        signal: options?.signal || controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            error: errorData.error || ERROR_MESSAGES.SERVER_ERROR,
            code: errorData.code || 'UNKNOWN_ERROR',
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

