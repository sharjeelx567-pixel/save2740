/**
 * Auth types for frontend application
 */

export interface User {
  id: string;
  _id?: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImage?: string;
  emailVerified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  referralCode?: string;
  referredBy?: string;
  accountTier?: 'basic' | 'pro' | 'business';
  dateOfBirth?: string;
  bio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  preferences?: {
    currency?: string;
    language?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    autoDebit?: {
      enabled: boolean;
      amount: number;
      frequency: 'daily' | 'weekly' | 'monthly';
      paymentMethodId?: string | null;
      nextDebitDate?: string;
    };
  };
  biometricEnabled?: boolean;
  role: 'user' | 'admin';
  accountStatus: 'active' | 'suspended' | 'locked';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id?: string;
  userId?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  referralCode?: string;
}

export interface AuthContextType extends AuthState {
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
