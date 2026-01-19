"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { User, Session, AuthState, LoginPayload, SignUpPayload } from "@/types/auth";

interface AuthContextType extends AuthState {
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  signup: (payload: SignUpPayload) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  setupBiometric: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  checkAccountStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedSession = localStorage.getItem("session");
        const storedUser = localStorage.getItem("user");

        if (storedSession && storedUser) {
          const session = JSON.parse(storedSession);
          const user = JSON.parse(storedUser);

          // Check if session is still valid
          if (new Date(session.expiresAt) > new Date()) {
            setState({
              isAuthenticated: true,
              user,
              session,
              loading: false,
              error: null,
            });
          } else {
            // Session expired, clear storage
            localStorage.removeItem("session");
            localStorage.removeItem("user");
            setState({
              isAuthenticated: false,
              user: null,
              session: null,
              loading: false,
              error: null,
            });
          }
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginPayload) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const { user, session } = data.data;

      localStorage.setItem("session", JSON.stringify(session));
      localStorage.setItem("user", JSON.stringify(user));

      setState({
        isAuthenticated: true,
        user,
        session,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Login failed",
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: state.session?.id }),
      });

      localStorage.removeItem("session");
      localStorage.removeItem("user");

      setState({
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Logout failed",
      }));
      throw error;
    }
  }, [state.session]);

  const signup = useCallback(async (payload: SignUpPayload) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      const { user } = data.data;

      // Don't set as authenticated yet, need to verify email
      localStorage.setItem("pending_email_verification", user.email);
      localStorage.setItem("temp_user", JSON.stringify(user));

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Signup failed",
      }));
      throw error;
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Email verification failed");
      }

      localStorage.removeItem("pending_email_verification");

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Email verification failed",
      }));
      throw error;
    }
  }, []);

  const verifyOTP = useCallback(async (phoneNumber: string, otp: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "OTP verification failed",
      }));
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Forgot password request failed");
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Forgot password request failed",
      }));
      throw error;
    }
  }, []);

  const resetPassword = useCallback(
    async (token: string, password: string, confirmPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password, confirmPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Password reset failed");
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Password reset failed",
        }));
        throw error;
      }
    },
    []
  );

  const setupBiometric = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Biometric authentication is not supported on this device");
      }

      // This would be implemented with actual WebAuthn API
      // For now, this is a placeholder
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Biometric setup failed",
      }));
      throw error;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!state.session) return;

    try {
      const response = await fetch("/api/auth/refresh-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: state.session.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Session refresh failed");
      }

      const { session } = data.data;

      localStorage.setItem("session", JSON.stringify(session));

      setState((prev) => ({
        ...prev,
        session,
      }));
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      setState((prev) => ({
        ...prev,
        error: "Session expired. Please login again.",
      }));
    }
  }, [state.session, logout]);

  const checkAccountStatus = useCallback(async () => {
    if (!state.user) return;

    try {
      const response = await fetch(`/api/auth/check-account-status/${state.user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.data.accountStatus !== "active") {
        setState((prev) => ({
          ...prev,
          user: data.data,
          error: `Account is ${data.data.accountStatus}`,
        }));
      }
    } catch (error) {
      // Silent fail
    }
  }, [state.user]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    signup,
    verifyEmail,
    verifyOTP,
    forgotPassword,
    resetPassword,
    setupBiometric,
    refreshSession,
    clearError,
    checkAccountStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
