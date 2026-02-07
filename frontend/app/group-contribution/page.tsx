"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedPage } from "@/components/protected-page"
import {
  Users, RotateCcw, Lock, Loader2, AlertCircle, Plus, Copy, Check,
  Send, Calendar, DollarSign, ArrowRight, ArrowLeft, Eye, EyeOff,
  Clock, CheckCircle, XCircle, TrendingUp, Share2, UserPlus,
  FileText, Bell, Shield, Award, ChevronRight, Wallet, ChevronDown,
  Mail, MessageCircle, Shuffle, Download, ExternalLink, HelpCircle
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { API } from "@/lib/constants"

// ==================== INTERFACES ====================

interface GroupMember {
  userId: string
  name: string
  email: string
  joinedAt: string
  totalContributed: number
  payoutPosition: number
  status: 'active' | 'inactive' | 'removed' | 'chain_broken'
  lastContributionDate?: string
  missedContributions: number
}

interface Contribution {
  userId: string
  amount: number
  paidAt: string
  status: 'paid' | 'pending' | 'late' | 'missed'
  transactionId?: string
  lateFee?: number
}

interface Round {
  roundNumber: number
  dueDate: string
  recipientId: string
  recipientName: string
  expectedAmount: number
  collectedAmount: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  contributions: Contribution[]
  payoutDate?: string
}

interface ChainBreak {
  userId: string
  userName: string
  roundNumber: number
  forfeitedAmount: number
  date: string
}

interface Group {
  _id: string
  name: string
  purpose: string
  contributionAmount: number
  frequency: "daily" | "weekly" | "monthly"
  maxMembers: number
  currency: string
  payoutOrderRule: "as-joined" | "random" | "manual"
  rules?: string
  joinCode: string
  referralLink: string
  status: 'open' | 'locked' | 'active' | 'completed' | 'failed' | 'at_risk'

  // Chain Break Rules
  forfeitOnMissedPayment: boolean
  gracePeriodHours: number
  lateFeePercentage: number
  chainBreakPenaltyDays: number

  // Dates
  startDate?: string
  endDate?: string
  lockedDate?: string
  filledDate?: string
  autoStartDate?: string
  autoEndDate?: string

  // Stats
  currentRound: number
  currentMembers: number
  totalRounds: number
  escrowBalance: number
  totalBalance: number
  totalContributed: number
  totalPaidOut: number

  // Creator
  creatorId: string
  creatorEmail: string

  // Data
  members: GroupMember[]
  rounds: Round[]
  chainBreaks: ChainBreak[]

  createdAt: string
  updatedAt: string
}

interface Transaction {
  id: string
  memberId: string
  memberName: string
  amount: number
  date: string
  description: string
  status: string
}

interface LedgerEntry {
  roundNumber: number
  dueDate: string
  recipient: string
  expectedAmount: number
  collectedAmount: number
  status: string
  contributions: number
  payoutDate?: string
}

// ==================== UI COMPONENTS ====================

const StatusBadge = ({ status }: { status: Group['status'] }) => {
  const styles: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-800 border-emerald-200",
    locked: "bg-amber-100 text-amber-800 border-amber-200",
    active: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-purple-100 text-purple-800 border-purple-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    at_risk: "bg-orange-100 text-orange-800 border-orange-200",
  }

  const labels: Record<string, string> = {
    open: "Open for Join",
    locked: "Locked / Full",
    active: "Active Cycle",
    completed: "Completed",
    failed: "Terminated",
    at_risk: "Action Needed",
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.open}`}>
      {labels[status] || status}
    </span>
  )
}

const ProgressBar = ({ current, total, label }: { current: number, total: number, label?: string }) => {
  const percentage = Math.min(100, Math.max(0, total > 0 ? (current / total) * 100 : 0))
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-700">{current} / {total}</span>
        </div>
      )}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-green transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

const MemberAvatar = ({ name, size = "md" }: { name: string, size?: "sm" | "md" | "lg" }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm`}>
      {initials}
    </div>
  )
}

// ==================== MAIN COMPONENT ====================

function GroupContributionPageContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  // Parse JWT to get current user
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        setCurrentUser(JSON.parse(jsonPayload))
      } catch (e) {
        console.error("Token decode error", e)
      }
    }
  }, [])

  // State
  const [view, setView] = useState<"list" | "create" | "detail" | "join" | "ledger">("list")
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])

  // Form states
  const [formData, setFormData] = useState({
    groupName: "",
    purpose: "",
    contributionAmount: "",
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    maxMembers: "10",
    currency: "USD",
    payoutOrderRule: "as-joined",
    rules: "",
  })

  const [contributionData, setContributionData] = useState({
    amount: "",
    description: "",
  })

  const [joinCode, setJoinCode] = useState("")

  // ==================== API CALLS ====================

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (data.success) {
        setGroups(data.data || [])
      } else {
        setError(data.error || 'Failed to load groups')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.groupName,
          purpose: formData.purpose,
          contributionAmount: parseFloat(formData.contributionAmount),
          frequency: formData.frequency,
          maxMembers: parseInt(formData.maxMembers),
          payoutOrderRule: formData.payoutOrderRule,
          rules: formData.rules,
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Group Created!",
          description: `${formData.groupName} has been created successfully.`,
        })
        setFormData({
          groupName: "",
          purpose: "",
          contributionAmount: "",
          frequency: "weekly",
          maxMembers: "10",
          currency: "USD",
          payoutOrderRule: "as-joined",
          rules: "",
        })
        fetchGroups()
        setView("list")
      } else {
        setError(data.error || 'Failed to create group')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase() })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Joined Group!",
          description: `You have successfully joined ${data.data.name}.`,
        })
        setJoinCode("")
        fetchGroups()
        setView("list")
      } else {
        setError(data.error || 'Failed to join group')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups/${selectedGroup._id}/contribute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(contributionData.amount),
          description: contributionData.description
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Contribution Successful!",
          description: `$${contributionData.amount} has been contributed.`,
        })
        setContributionData({ amount: "", description: "" })
        // Refresh group details
        const groupRes = await fetch(`${API.BASE_URL}/api/groups/${selectedGroup._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const groupData = await groupRes.json()
        if (groupData.success) {
          setSelectedGroup(groupData.data)
        }
        fetchGroups()
      } else {
        setError(data.error || 'Failed to contribute')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return

    if (!confirm('Are you sure you want to leave this group?')) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ groupId: selectedGroup._id })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Left Group",
          description: "You have successfully left the group.",
        })
        setSelectedGroup(null)
        setView("list")
        fetchGroups()
      } else {
        setError(data.error || 'Failed to leave group')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLockGroup = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups/${selectedGroup._id}/lock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Group Locked", description: "No new members can join." })
        setSelectedGroup(data.data)
        fetchGroups()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to lock group')
    } finally {
      setLoading(false)
    }
  }

  const handleStartGroup = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups/${selectedGroup._id}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Group Started!", description: "The contribution cycle has begun." })
        setSelectedGroup(data.data)
        fetchGroups()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to start group')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseRound = async () => {
    if (!selectedGroup) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/groups/${selectedGroup._id}/close-round`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        toast({ title: "Round Closed", description: `Round ${data.data.roundClosed} has been processed.` })
        setSelectedGroup(data.data.group)
        fetchGroups()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to close round')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied!", description: "Invite code copied to clipboard." })
  }

  const viewGroupDetails = async (group: Group) => {
    setSelectedGroup(group)
    setView("detail")

    // Fetch transactions for the group
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API.BASE_URL}/api/groups/${group._id}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setTransactions(data.data || [])
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err)
    }
  }

  const viewLedger = async () => {
    if (!selectedGroup) return
    setView("ledger")

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API.BASE_URL}/api/groups/${selectedGroup._id}/ledger`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setLedger(data.data.ledger || [])
      }
    } catch (err) {
      console.error("Failed to fetch ledger", err)
    }
  }

  const getCurrentMember = () => {
    if (!selectedGroup || !currentUser) return null
    return selectedGroup.members.find(m => m.userId === currentUser.userId)
  }

  const isCreator = () => {
    if (!selectedGroup || !currentUser) return false
    return selectedGroup.creatorId === currentUser.userId
  }

  // ==================== RENDER ====================

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="Group Contribution" onMenuClick={() => setIsMobileMenuOpen(true)} showMobileTitle={false} />

        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64 border-none">
                <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Error Banner */}
            {error && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700 font-bold">✕</button>
                </CardContent>
              </Card>
            )}

            {/* ==================== LIST VIEW ==================== */}
            {view === "list" && (
              <>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                  </div>
                ) : groups.length === 0 ? (
                  /* Professional Landing Page */
                  <div className="space-y-12">
                    
                    {/* ===== HERO SECTION ===== */}
                    <div className="text-center max-w-3xl mx-auto py-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-full mb-6">
                        <Users className="w-4 h-4 text-brand-green" />
                        <span className="text-sm font-medium text-brand-green">Group Savings Made Simple</span>
                      </div>
                      
                      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        Save Together with <span className="text-brand-green">Trusted Circles</span>
                      </h1>
                      
                      <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                        Create or join rotating savings groups. Collect contributions, rotate payouts automatically, and keep a transparent ledger everyone can trust.
                      </p>

                      <div className="flex flex-wrap justify-center gap-4 mb-8">
                        <button
                          onClick={() => setView("create")}
                          className="inline-flex items-center gap-2 bg-brand-green text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/25"
                        >
                          <Plus className="w-5 h-5" />
                          Create a Group
                        </button>
                        <button
                          onClick={() => setView("join")}
                          className="inline-flex items-center gap-2 border-2 border-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all"
                        >
                          <UserPlus className="w-5 h-5" />
                          Join with Code
                        </button>
                      </div>

                      <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-brand-green" /> Free to use
                        </span>
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-brand-green" /> Transparent ledger
                        </span>
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-brand-green" /> Automated payouts
                        </span>
                      </div>
                    </div>

                    {/* ===== HOW IT WORKS ===== */}
                    <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100">
                      <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
                        <p className="text-slate-600 max-w-xl mx-auto">A simple rotating savings cycle — organized and transparent</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Plus className="w-8 h-8 text-brand-green" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg mb-2">1. Create a Group</h3>
                          <p className="text-slate-600">Set contribution amount, frequency, and invite your trusted circle of friends or family.</p>
                        </div>

                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Users className="w-8 h-8 text-blue-600" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg mb-2">2. Members Contribute</h3>
                          <p className="text-slate-600">Each member contributes the agreed amount every round. Track all payments transparently.</p>
                        </div>

                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <RotateCcw className="w-8 h-8 text-purple-600" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg mb-2">3. Rotate Payouts</h3>
                          <p className="text-slate-600">Each round, one member receives the full pot. Continue until everyone has received.</p>
                        </div>
                      </div>
                    </div>

                    {/* ===== FEATURES ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mb-4">
                          <Users className="w-6 h-6 text-brand-green" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Group Management</h3>
                        <p className="text-sm text-slate-600">Create groups, invite members, and manage roles. Admin controls for full oversight.</p>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Transparent Ledger</h3>
                        <p className="text-sm text-slate-600">See who paid, who is late, and who received payout — all in one public group ledger.</p>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                          <Bell className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Smart Reminders</h3>
                        <p className="text-sm text-slate-600">Automated reminders before due dates. Never miss a contribution payment.</p>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                          <Shield className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Rules & Penalties</h3>
                        <p className="text-sm text-slate-600">Set late fees, grace periods, and group rules. Accountability built-in.</p>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                          <Share2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Easy Invites</h3>
                        <p className="text-sm text-slate-600">Share a simple code or link. Members join instantly and appear in payout order.</p>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                          <TrendingUp className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Track Progress</h3>
                        <p className="text-sm text-slate-600">Monitor rounds, contributions, and payouts. Full visibility for all members.</p>
                      </div>
                    </div>

                    {/* ===== CTA SECTION ===== */}
                    <div className="bg-gradient-to-r from-brand-green to-emerald-600 rounded-2xl p-8 md:p-12 text-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Start Saving Together?</h2>
                      <p className="text-white/90 mb-8 max-w-xl mx-auto">Create your first group in minutes and invite your trusted circle to join.</p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <button
                          onClick={() => setView("create")}
                          className="inline-flex items-center gap-2 bg-white text-brand-green px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                          Create Your First Group
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Groups List */
                  <>
                    {/* Header with Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Groups</h1>
                        <p className="text-slate-600">Manage your savings circles</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setView("join")}
                          className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Join
                        </button>
                        <button
                          onClick={() => setView("create")}
                          className="inline-flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create
                        </button>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <p className="text-sm text-slate-500">Total Groups</p>
                          <p className="text-2xl font-bold text-slate-900">{groups.length}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <p className="text-sm text-slate-500">Active</p>
                          <p className="text-2xl font-bold text-brand-green">
                            {groups.filter(g => g.status === 'active').length}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <p className="text-sm text-slate-500">Total Contributed</p>
                          <p className="text-2xl font-bold text-slate-900">
                            ${groups.reduce((sum, g) => sum + (g.totalContributed || 0), 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <p className="text-sm text-slate-500">Total Received</p>
                          <p className="text-2xl font-bold text-slate-900">
                            ${groups.reduce((sum, g) => sum + (g.totalPaidOut || 0), 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Groups Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groups.map((group) => (
                        <Card
                          key={group._id}
                          className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => viewGroupDetails(group)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{group.name}</h3>
                                <p className="text-sm text-slate-500 line-clamp-1">{group.purpose}</p>
                              </div>
                              <StatusBadge status={group.status} />
                            </div>

                            <div className="space-y-3 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Contribution</span>
                                <span className="font-semibold text-slate-900">
                                  ${group.contributionAmount} / {group.frequency}
                                </span>
                              </div>
                              <ProgressBar
                                current={group.currentMembers || 0}
                                total={group.maxMembers || 10}
                                label="Members"
                              />
                              {group.status === 'active' && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Round</span>
                                  <span className="font-semibold text-slate-900">
                                    {group.currentRound || 1} / {group.totalRounds || group.maxMembers}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex -space-x-2">
                              {group.members?.slice(0, 5).map((member, idx) => (
                                <MemberAvatar key={idx} name={member.name} size="sm" />
                              ))}
                              {(group.members?.length || 0) > 5 && (
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                  +{group.members.length - 5}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ==================== CREATE VIEW ==================== */}
            {view === "create" && (
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={() => setView("list")}
                  className="text-brand-green hover:text-brand-green/80 font-semibold mb-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Groups
                </button>

                <Card className="border-none shadow-lg bg-white">
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Group</h2>
                    <p className="text-slate-600 mb-6">Set up your savings circle and invite members</p>

                    <form onSubmit={handleCreateGroup} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Group Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.groupName}
                          onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                          placeholder="e.g., Family Savings Circle"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Purpose</label>
                        <input
                          type="text"
                          value={formData.purpose}
                          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                          placeholder="e.g., Emergency fund savings"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Contribution Amount *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                              type="number"
                              required
                              min="1"
                              step="0.01"
                              value={formData.contributionAmount}
                              onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                              placeholder="100.00"
                              className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Frequency</label>
                          <select
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Max Members</label>
                          <input
                            type="number"
                            min="2"
                            max="20"
                            value={formData.maxMembers}
                            onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            {parseInt(formData.maxMembers) <= 5 ? '👥 Personal & high accountability' :
                             parseInt(formData.maxMembers) <= 10 ? '⭐ Best balance (recommended)' :
                             parseInt(formData.maxMembers) <= 20 ? '🏘️ Community feel, manageable' :
                             '⚠️ Max 20 members allowed'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Payout Order</label>
                          <select
                            value={formData.payoutOrderRule}
                            onChange={(e) => setFormData({ ...formData, payoutOrderRule: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent bg-white"
                          >
                            <option value="as-joined">First Come, First Served</option>
                            <option value="random">Random Assignment</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Group Rules (Optional)</label>
                        <textarea
                          value={formData.rules}
                          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                          placeholder="Any specific rules for members..."
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent resize-none bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-green hover:bg-brand-green/90 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {loading ? 'Creating...' : 'Create Group'}
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== JOIN VIEW ==================== */}
            {view === "join" && (
              <div className="max-w-md mx-auto">
                <button
                  onClick={() => setView("list")}
                  className="text-brand-green hover:text-brand-green/80 font-semibold mb-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Groups
                </button>

                <Card className="border-none shadow-lg bg-white">
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Join a Group</h2>
                    <p className="text-slate-600 mb-6">Enter the invite code shared by the group creator</p>

                    <form onSubmit={handleJoinGroup} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Invite Code *</label>
                        <input
                          type="text"
                          required
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          placeholder="e.g., ABC123"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-center text-lg uppercase tracking-widest bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !joinCode.trim()}
                        className="w-full bg-brand-green hover:bg-brand-green/90 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                        {loading ? 'Joining...' : 'Join Group'}
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== DETAIL VIEW ==================== */}
            {view === "detail" && selectedGroup && (
              <>
                <button
                  onClick={() => { setSelectedGroup(null); setView("list") }}
                  className="text-brand-green hover:text-brand-green/80 font-semibold mb-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Groups
                </button>

                {/* Group Header */}
                <Card className="border-none shadow-sm mb-6 bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-2xl font-bold text-slate-900">{selectedGroup.name}</h1>
                          <StatusBadge status={selectedGroup.status} />
                        </div>
                        <p className="text-slate-600">{selectedGroup.purpose}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => copyToClipboard(selectedGroup.joinCode)}
                          className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          {selectedGroup.joinCode}
                        </button>
                        <button
                          onClick={viewLedger}
                          className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Ledger
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Details */}
                  <div className="lg:col-span-2 space-y-6">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 text-center">
                          <DollarSign className="w-6 h-6 text-brand-green mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Contribution</p>
                          <p className="text-lg font-bold text-slate-900">${selectedGroup.contributionAmount}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 text-center">
                          <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Frequency</p>
                          <p className="text-lg font-bold text-slate-900 capitalize">{selectedGroup.frequency}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 text-center">
                          <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Members</p>
                          <p className="text-lg font-bold text-slate-900">{selectedGroup.currentMembers}/{selectedGroup.maxMembers}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 text-center">
                          <RotateCcw className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Round</p>
                          <p className="text-lg font-bold text-slate-900">{selectedGroup.currentRound || 1}/{selectedGroup.totalRounds || selectedGroup.maxMembers}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Admin Actions */}
                    {isCreator() && (
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-slate-900 mb-3">Admin Actions</h3>
                          <div className="flex flex-wrap gap-3">
                            {selectedGroup.status === 'open' && (
                              <button
                                onClick={handleLockGroup}
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-medium hover:bg-amber-200 transition-colors"
                              >
                                <Lock className="w-4 h-4" />
                                Lock Group
                              </button>
                            )}
                            {selectedGroup.status === 'locked' && (
                              <button
                                onClick={handleStartGroup}
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Start Contributions
                              </button>
                            )}
                            {selectedGroup.status === 'active' && (
                              <button
                                onClick={handleCloseRound}
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Close Current Round
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Members List */}
                    <Card className="border-none shadow-sm bg-white">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-slate-900 mb-4">Members</h3>
                        <div className="space-y-3">
                          {selectedGroup.members.map((member, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <MemberAvatar name={member.name} />
                                <div>
                                  <p className="font-semibold text-slate-900">{member.name}</p>
                                  <p className="text-xs text-slate-500">Position #{member.payoutPosition}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">${member.totalContributed?.toFixed(2) || '0.00'}</p>
                                <p className={`text-xs ${member.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                  {member.status}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rounds Schedule */}
                    {selectedGroup.rounds && selectedGroup.rounds.length > 0 && (
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-slate-900 mb-4">Rounds Schedule</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Round</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Recipient</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Due Date</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedGroup.rounds.map((round) => (
                                  <tr key={round.roundNumber} className="border-b">
                                    <td className="py-2 px-3 font-medium">#{round.roundNumber}</td>
                                    <td className="py-2 px-3">{round.recipientName}</td>
                                    <td className="py-2 px-3">{new Date(round.dueDate).toLocaleDateString()}</td>
                                    <td className="py-2 px-3 text-right">
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        round.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        round.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {round.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right Column - Actions */}
                  <div className="space-y-6">

                    {/* My Status */}
                    <Card className="border-none shadow-sm bg-brand-green text-white">
                      <CardContent className="p-6">
                        <p className="text-sm opacity-80 mb-1">My Contribution</p>
                        <h3 className="text-3xl font-bold mb-2">${getCurrentMember()?.totalContributed?.toFixed(2) || '0.00'}</h3>
                        {getCurrentMember() && (
                          <p className="text-sm opacity-80">
                            Payout Position: <span className="font-bold">#{getCurrentMember()?.payoutPosition}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Contribute Form */}
                    {selectedGroup.status === 'active' && (
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-slate-900 mb-4">Make a Contribution</h3>
                          <form onSubmit={handleContribute} className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Amount ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={contributionData.amount}
                                onChange={(e) => setContributionData({ ...contributionData, amount: e.target.value })}
                                placeholder={selectedGroup.contributionAmount.toString()}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Note (Optional)</label>
                              <input
                                type="text"
                                value={contributionData.description}
                                onChange={(e) => setContributionData({ ...contributionData, description: e.target.value })}
                                placeholder="e.g., Round 3 payment"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-brand-green hover:bg-brand-green/90 text-white px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              {loading ? 'Submitting...' : 'Submit Contribution'}
                            </button>
                          </form>
                        </CardContent>
                      </Card>
                    )}

                    {/* Leave Group */}
                    {selectedGroup.status === 'open' && !isCreator() && (
                      <button
                        onClick={handleLeaveGroup}
                        disabled={loading}
                        className="w-full border border-red-300 text-red-600 px-4 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Leave Group
                      </button>
                    )}

                    {/* Transactions */}
                    {transactions.length > 0 && (
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-slate-900 mb-4">Recent Transactions</h3>
                          <div className="space-y-2">
                            {transactions.slice(0, 5).map((txn) => (
                              <div key={txn.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                <div>
                                  <p className="font-medium text-slate-900 text-sm">{txn.memberName}</p>
                                  <p className="text-xs text-slate-500">{new Date(txn.date).toLocaleDateString()}</p>
                                </div>
                                <p className="font-bold text-slate-900">${txn.amount}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ==================== LEDGER VIEW ==================== */}
            {view === "ledger" && selectedGroup && (
              <>
                <button
                  onClick={() => setView("detail")}
                  className="text-brand-green hover:text-brand-green/80 font-semibold mb-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Group
                </button>

                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Ledger Transparency</h2>
                    <p className="text-slate-600 mb-6">{selectedGroup.name} — Full payment history</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Round</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Due Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Recipient</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">Expected</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-600">Collected</th>
                            <th className="text-center py-3 px-4 font-semibold text-slate-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledger.length > 0 ? ledger.map((entry) => (
                            <tr key={entry.roundNumber} className="border-b hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium">#{entry.roundNumber}</td>
                              <td className="py-3 px-4">{new Date(entry.dueDate).toLocaleDateString()}</td>
                              <td className="py-3 px-4">{entry.recipient}</td>
                              <td className="py-3 px-4 text-right">${entry.expectedAmount.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-semibold">${entry.collectedAmount.toFixed(2)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  entry.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  entry.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  entry.status === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {entry.status}
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500">
                                No ledger data available yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Chain Breaks */}
                    {selectedGroup.chainBreaks && selectedGroup.chainBreaks.length > 0 && (
                      <div className="mt-8 pt-6 border-t">
                        <h4 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          Chain Breaks
                        </h4>
                        <div className="space-y-3">
                          {selectedGroup.chainBreaks.map((cb, idx) => (
                            <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-100">
                              <p className="font-semibold text-red-800">{cb.userName}</p>
                              <p className="text-sm text-red-600">
                                Round {cb.roundNumber} • Forfeited: ${cb.forfeitedAmount.toFixed(2)} • {new Date(cb.date).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default function GroupContributionPage() {
  return (
    <ProtectedPage>
      <GroupContributionPageContent />
    </ProtectedPage>
  )
}
