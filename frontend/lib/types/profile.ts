/**
 * Profile & Account Types
 * TypeScript interfaces for profile, KYC, and account management
 */

/**
 * User Profile Information
 */
export interface UserProfile {
  userId: string
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
  phone: string
  phoneVerified: boolean
  dateOfBirth: string
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  nationality: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  profilePicture?: {
    url: string
    uploadedAt: string
  }
  bio: string
  socialMedia?: {
    linkedin?: string
    twitter?: string
    instagram?: string
  }
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  privacySettings: {
    profileVisibility: 'private' | 'friends' | 'public'
    showEmail: boolean
    showPhone: boolean
    activityNotifications: boolean
  }
  twoFactorEnabled: boolean
  lastLogin: string
  createdAt: string
  updatedAt: string
}

/**
 * KYC (Know Your Customer) Status
 */
export interface KYCStatus {
  userId: string
  status: 'not_started' | 'pending' | 'verified' | 'rejected'
  completionPercentage: number
  identityVerified: boolean
  addressVerified: boolean
  sourceOfFundsVerified: boolean
  verificationDate?: string
  expiryDate?: string
  nextReviewDate?: string
  rejectionReason?: string
  documents: {
    idFront?: DocumentRecord
    idBack?: DocumentRecord
    selfie?: DocumentRecord
    addressProof?: DocumentRecord
  }
  limits: TransactionLimits
  createdAt: string
  updatedAt: string
}

/**
 * Document Record for KYC
 */
export interface DocumentRecord {
  type: 'id_front' | 'id_back' | 'selfie' | 'address_proof'
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  status: 'pending_review' | 'verified' | 'rejected'
  uploadedAt: string
  verifiedAt?: string
  expiryDate?: string
  rejectionReason?: string
}

/**
 * Transaction Limits
 */
export interface TransactionLimits {
  dailyTransactionLimit: number
  monthlyTransactionLimit: number
  annualTransactionLimit: number
  dailyWithdrawalLimit: number
  monthlyWithdrawalLimit: number
  singleTransactionLimit: number
}

/**
 * Linked Account (Bank/Card)
 */
export interface LinkedAccount {
  accountId: string
  userId: string
  type: 'bank_account' | 'credit_card' | 'debit_card'
  accountName: string
  accountNumber?: string // Masked
  routingNumber?: string
  bankName?: string
  cardNetwork?: 'visa' | 'mastercard' | 'amex' | 'discover'
  cardLastFour?: string
  expiryDate?: string
  provider: 'plaid' | 'stripe' | 'manual'
  linkedAt: string
  verificationStatus: 'pending' | 'verified' | 'failed'
  isPrimary: boolean
  isActive: boolean
}

/**
 * Security Settings
 */
export interface SecuritySettings {
  userId: string
  twoFactorEnabled: boolean
  twoFactorMethod: 'sms' | 'email' | 'authenticator'
  lastPasswordChange: string
  loginAlerts: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  connectedDevices: ConnectedDevice[]
  activeSessions: ActiveSession[]
  recoveryEmails: string[]
  recoveryPhone?: string
}

/**
 * Connected Device
 */
export interface ConnectedDevice {
  deviceId: string
  deviceName: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  osType: 'ios' | 'android' | 'windows' | 'macos' | 'linux'
  browserType?: string
  ipAddress: string
  location: string
  lastActive: string
  addedAt: string
}

/**
 * Active Session
 */
export interface ActiveSession {
  sessionId: string
  deviceName: string
  location: string
  ipAddress: string
  browserType: string
  createdAt: string
  lastActive: string
  isCurrentSession: boolean
}

/**
 * Account Closure Request
 */
export interface AccountClosureRequest {
  userId: string
  status: 'requested' | 'scheduled_for_deletion' | 'cancelled'
  requestedAt: string
  scheduledDeletionDate: string
  cancellationToken?: string
  reason?: string
  deleteDataPermanently: boolean
  cancelledAt?: string
  message?: string
}

/**
 * API Response Types
 */
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Profile Update Request
 */
export interface ProfileUpdateRequest {
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  bio?: string
  emergencyContact?: {
    name?: string
    phone?: string
    relationship?: string
  }
}

/**
 * Password Change Request
 */
export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

/**
 * Security Change Request
 */
export interface SecurityChangeRequest {
  type: 'password' | 'email' | 'phone'
  currentPassword?: string
  newPassword?: string
  newEmail?: string
  newPhone?: string
  otpCode?: string
}

/**
 * Document Upload Response
 */
export interface DocumentUploadResponse {
  documentType: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: 'pending_review'
  url: string
}

/**
 * KYC Submission
 */
export interface KYCSubmission {
  documents: {
    idFront: File
    idBack: File
    selfie: File
    addressProof: File
  }
  livelinessProofUrl?: string
}
