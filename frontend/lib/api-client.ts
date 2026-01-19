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
    };

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Create abort controller with timeout
   */
  private createAbortSignal(): AbortSignal {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    return controller.signal;
  }

  /**
   * Parse error response from API
   */
  private parseError(error: unknown): ApiErrorResponse {
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: this.createAbortSignal(),
        credentials: 'include', // Include cookies in request
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            error: errorData.error || ERROR_MESSAGES.SERVER_ERROR,
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: this.createAbortSignal(),
        credentials: 'include', // Include cookies in request
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            error: errorData.error || ERROR_MESSAGES.SERVER_ERROR,
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
