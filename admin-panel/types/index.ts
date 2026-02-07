export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  status: 'active' | 'suspended' | 'locked' | 'deleted'
  accountStatus: string
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected'
  kycLevel: number
  walletBalance: number
  wallet?: {
    balance: number
    availableBalance: number
    locked: boolean
  }
  createdAt: string
  lastLogin?: string
}

export interface KYCRequest {
  id: string
  userId: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  documentType: 'passport' | 'drivers_license' | 'national_id'
  documentNumber: string
  documentFront: string
  documentBack?: string
  selfie: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

export interface Transaction {
  id: string
  userId: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'save2740' | 'refund'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description: string
  createdAt: string
  completedAt?: string
}

export interface Save2740Plan {
  id: string
  userId: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  challengeType: 'daily' | 'weekly' | 'monthly'
  multiplier: number
  currentDay: number
  totalSaved: number
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: string
  endDate?: string
  missedDays: number
  currentStreak: number
}

export interface Payment {
  id: string
  userId: string
  amount: number
  status: 'succeeded' | 'failed' | 'pending' | 'refunded'
  paymentMethod: string
  stripePaymentIntentId?: string
  failureReason?: string
  createdAt: string
}

export interface Referral {
  id: string
  referrerId: string
  referredUserId: string
  status: 'pending' | 'completed' | 'failed'
  rewardAmount: number
  createdAt: string
  completedAt?: string
}

export interface SupportTicket {
  id: string
  userId: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  subject: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  messages: Array<{
    id: string
    sender: 'user' | 'admin'
    message: string
    createdAt: string
  }>
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  pendingKYC: number
  totalWalletBalance: number
  dailyTransactions: number
  failedPayments: number
  activePlans: number
  totalRevenue: number
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  avatar?: string
}
