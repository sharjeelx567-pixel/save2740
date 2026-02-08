/**
 * Centralized API client for all HTTP requests
 * Ensures consistent auth, timeout handling, and error normalization
 */

import { API, STORAGE, ERROR_MESSAGES } from "@/lib/constants";
import { ApiErrorResponse, ApiResponse } from "@/lib/types";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API.BASE_URL, timeout: number = API.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /* -------------------------------------------------------------------------- */
  /*                                Auth Helpers                                */
  /* -------------------------------------------------------------------------- */

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(STORAGE.TOKEN);
    } catch {
      console.warn("Unable to read auth token");
      return null;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    };

    const token = this.getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    return headers;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Error Handling                                 */
  /* -------------------------------------------------------------------------- */

  private handleAuthErrors(code: string, status: number) {
    if (typeof window === "undefined") return;

    if (code === "SESSION_EXPIRED" || status === 401) {
      localStorage.removeItem(STORAGE.TOKEN);
      localStorage.removeItem("session");
      localStorage.removeItem("user");
      window.location.href = "/session-expired";
    }

    if (code === "ACCOUNT_LOCKED" || code === "ACCOUNT_SUSPENDED") {
      window.location.href = `/account-status?code=${code}`;
    }
  }

  private parseError(error: unknown): ApiErrorResponse {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { error: "Request timed out or cancelled.", code: "ABORT_ERROR" };
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return { error: ERROR_MESSAGES.NETWORK, code: "NETWORK_ERROR" };
    }

    if (error instanceof Error) {
      return { error: error.message, code: "UNKNOWN_ERROR" };
    }

    return { error: ERROR_MESSAGES.SERVER_ERROR, code: "UNKNOWN_ERROR" };
  }

  /* -------------------------------------------------------------------------- */
  /*                              Core Request                                   */
  /* -------------------------------------------------------------------------- */

  // Queue to hold requests while refreshing
  private isRefreshing = false;
  private failedQueue: any[] = [];

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async request<T, D = unknown>(
    method: HttpMethod,
    endpoint: string,
    body?: D,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const getOptions = (tokenOverride?: string) => {
        const headers = this.getHeaders() as Record<string, string>;
        if (tokenOverride) headers['Authorization'] = `Bearer ${tokenOverride}`;
        return {
          ...options,
          method,
          headers: {
            ...headers,
            ...options?.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: "include" as RequestCredentials,
          cache: "no-store" as RequestCache,
          signal: options?.signal || controller.signal,
        };
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, getOptions());

      // Handle 401 - Refresh Token Logic
      if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(token => {
            return this.request<T, D>(method, endpoint, body, { ...options, headers: { ...options?.headers, Authorization: `Bearer ${token}` } });
          }).catch(err => {
            return { success: false, error: this.parseError(err) };
          });
        }

        this.isRefreshing = true;

        try {
          // Call refresh endpoint
          const refreshResponse = await fetch(`${this.baseUrl}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          });

          const refreshData = await refreshResponse.json();

          if (refreshResponse.ok && refreshData.success) {
            const { accessToken } = refreshData.data;
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE.TOKEN, accessToken);
              // Update session object too if possible, but minimal update is token
              const sessionStr = localStorage.getItem("session");
              if (sessionStr) {
                const session = JSON.parse(sessionStr);
                session.accessToken = accessToken;
                localStorage.setItem("session", JSON.stringify(session));
              }
            }

            this.processQueue(null, accessToken);
            this.isRefreshing = false;

            // Retry original request
            return this.request<T, D>(method, endpoint, body, options);
          } else {
            throw new Error("Refresh failed");
          }
        } catch (error) {
          this.processQueue(error, null);
          this.isRefreshing = false;
          // Proceed to handleAuthErrors to logout
        }
      }

      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");

      const payload = isJson ? await response.json() : null;

      if (!response.ok) {
        const code = payload?.code || "UNKNOWN_ERROR";
        // Only handle auth errors if it wasn't a 401 that we tried to refresh (or if refresh failed)
        this.handleAuthErrors(code, response.status);

        return {
          success: false,
          error: {
            error: payload?.error || ERROR_MESSAGES.SERVER_ERROR,
            code,
            status: response.status,
          },
        };
      }

      return { success: true, data: payload as T };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { success: false, error: { code: "TIMEOUT", error: "Request timed out" } };
      }
      return { success: false, error: this.parseError(error) };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             Public Methods                                   */
  /* -------------------------------------------------------------------------- */

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  post<T, D = unknown>(endpoint: string, body?: D, options?: RequestInit) {
    return this.request<T, D>("POST", endpoint, body, options);
  }

  put<T, D = unknown>(endpoint: string, body?: D, options?: RequestInit) {
    return this.request<T, D>("PUT", endpoint, body, options);
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }
}

export const apiClient = new ApiClient();
