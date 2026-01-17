"use client"

import { useState, useEffect } from "react"
import { ProtectedPage } from "@/components/protected-page"
import {
  Users, RotateCcw, Lock, Loader2, AlertCircle, Plus, Copy, Check,
  Send, Calendar, DollarSign, ArrowRight, Trash2, Eye, EyeOff
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"

interface GroupMember {
  id: string
  name: string
  email: string
  contributionAmount: number
  totalContributed: number
  referredBy?: string
}

interface Transaction {
  id: string
  memberId: string
  memberName: string
  amount: number
  date: string
  description: string
}

interface Group {
  id: string
  name: string
  purpose: string
  contributionAmount: number
  frequency: "daily" | "weekly" | "monthly"
  maxMembers: number
  currency?: string
  payoutOrderRule?: string
  rules?: string
  joinCode?: string
  isLocked: boolean
  startDate: string | null
  closingDate: string | null
  endDate: string | null
  referralCode: string
  referralLink: string
  members: GroupMember[]
  balance: number
  totalContributed: number
  createdAt: string
}

function GroupContributionPageContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [view, setView] = useState<"list" | "create" | "detail" | "join">("list")
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showNewMemberModal, setShowNewMemberModal] = useState(false)

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
    closingDate: "",
  })

  const [contributionData, setContributionData] = useState({
    amount: "",
    description: "",
  })

  const [joinData, setJoinData] = useState({
    referralCode: "",
  })
  const { toast } = useToast()

  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Date calculation utility
  const calculateEndDate = (startDate: Date, frequency: string, maxMembers: number): Date => {
    const endDate = new Date(startDate)

    switch (frequency) {
      case "daily":
        endDate.setDate(endDate.getDate() + maxMembers)
        break
      case "weekly":
        endDate.setDate(endDate.getDate() + (maxMembers * 7))
        break
      case "monthly":
        endDate.setMonth(endDate.getMonth() + maxMembers)
        break
    }

    return endDate
  }

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockGroups: Group[] = [
        {
          id: "group-1",
          name: "Friends Circle",
          purpose: "Quarterly vacation fund",
          contributionAmount: 27.40,
          frequency: "weekly",
          maxMembers: 10,
          isLocked: false,
          startDate: null,
          endDate: null,
          referralCode: "FC2024",
          referralLink: "https://save2740.app/join/FC2024",
          balance: 1096,
          totalContributed: 2192,
          createdAt: "2024-01-15",
          members: [
            {
              id: "m1",
              name: "John Doe",
              email: "john@example.com",
              contributionAmount: 27.40,
              totalContributed: 274,
            },
            {
              id: "m2",
              name: "Jane Smith",
              email: "jane@example.com",
              contributionAmount: 27.40,
              totalContributed: 246.60,
              referredBy: "John Doe",
            },
            {
              id: "m3",
              name: "Mike Johnson",
              email: "mike@example.com",
              contributionAmount: 27.40,
              totalContributed: 219.20,
            },
            {
              id: "m4",
              name: "Sarah Williams",
              email: "sarah@example.com",
              contributionAmount: 27.40,
              totalContributed: 191.80,
            },
          ],
        },
      ]
      setGroups(mockGroups)

      // Mock transactions
      const mockTransactions: Transaction[] = [
        {
          id: "t1",
          memberId: "m1",
          memberName: "John Doe",
          amount: 27.40,
          date: "2024-01-22 10:30 AM",
          description: "Weekly contribution",
        },
        {
          id: "t2",
          memberId: "m2",
          memberName: "Jane Smith",
          amount: 27.40,
          date: "2024-01-22 09:15 AM",
          description: "Weekly contribution",
        },
        {
          id: "t3",
          memberId: "m3",
          memberName: "Mike Johnson",
          amount: 27.40,
          date: "2024-01-21 02:45 PM",
          description: "Weekly contribution",
        },
      ]
      setTransactions(mockTransactions)
    } catch (err) {
      setError("Failed to load groups")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newGroup: Group = {
        id: `group-${Date.now()}`,
        name: formData.groupName,
        purpose: formData.purpose,
        contributionAmount: parseFloat(formData.contributionAmount),
        frequency: formData.frequency,
        maxMembers: parseInt(formData.maxMembers),
        currency: formData.currency,
        payoutOrderRule: formData.payoutOrderRule,
        rules: formData.rules,
        isLocked: false,
        startDate: new Date().toISOString(),
        closingDate: new Date(formData.closingDate).toISOString(),
        endDate: null,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referralLink: `https://save2740.app/join/${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        members: [
          {
            id: "user-current",
            name: "You",
            email: "user@example.com",
            contributionAmount: parseFloat(formData.contributionAmount),
            totalContributed: parseFloat(formData.contributionAmount),
          },
        ],
        balance: parseFloat(formData.contributionAmount),
        totalContributed: parseFloat(formData.contributionAmount),
        createdAt: new Date().toISOString(),
      }

      setGroups([...groups, newGroup])
      setSelectedGroup(newGroup)
      setView("detail")
      setFormData({
        groupName: "",
        purpose: "",
        contributionAmount: "",
        frequency: "weekly",
        maxMembers: "10",
        currency: "USD",
        payoutOrderRule: "as-joined",
        rules: "",
        closingDate: "",
      })
      toast({
        title: "Group Created!",
        description: `${newGroup.name} has been successfully created.`,
      })
    } catch (err) {
      setError("Failed to create group")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create group. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const groupToJoin = groups.find(g => g.referralCode === joinData.referralCode)
      if (!groupToJoin) {
        setError("Invalid referral code")
        setLoading(false)
        return
      }

      // Check if group is locked
      if (groupToJoin.isLocked) {
        setError("This group is full and no longer accepting members")
        setLoading(false)
        return
      }

      // Check if group is at max capacity
      if (groupToJoin.members.length >= groupToJoin.maxMembers) {
        setError("This group has reached maximum capacity")
        setLoading(false)
        return
      }

      // Add new member
      const newMember: GroupMember = {
        id: `member-${Date.now()}`,
        name: "New Member",
        email: "newmember@example.com",
        contributionAmount: groupToJoin.contributionAmount,
        totalContributed: 0,
        referredBy: "Group Admin",
      }

      const updatedMembers = [...groupToJoin.members, newMember]

      // Check if max members reached after adding
      const isNowFull = updatedMembers.length >= groupToJoin.maxMembers
      let updatedGroup = {
        ...groupToJoin,
        members: updatedMembers,
        isLocked: isNowFull,
      }

      // If group is now full, set dates
      if (isNowFull) {
        const startDate = new Date()
        const endDate = calculateEndDate(startDate, groupToJoin.frequency, groupToJoin.maxMembers)

        updatedGroup = {
          ...updatedGroup,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }
      }

      setGroups(groups.map(g => g.id === groupToJoin.id ? updatedGroup : g))
      setSelectedGroup(updatedGroup)
      setJoinData({ referralCode: "" })
      setShowNewMemberModal(false)
      toast({
        title: "Joined Group!",
        description: `You have successfully joined ${updatedGroup.name}.`,
      })
    } catch (err) {
      setError("Failed to join group")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join group. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) return

    setLoading(true)
    try {
      const amount = parseFloat(contributionData.amount)

      // Create transaction
      const newTransaction: Transaction = {
        id: `t-${Date.now()}`,
        memberId: "m1",
        memberName: "You",
        amount,
        date: new Date().toLocaleString(),
        description: contributionData.description,
      }

      // Update group balance
      const updatedGroup = {
        ...selectedGroup,
        balance: selectedGroup.balance + amount,
        totalContributed: selectedGroup.totalContributed + amount,
      }

      setTransactions([newTransaction, ...transactions])
      setSelectedGroup(updatedGroup)
      setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g))
      setContributionData({ amount: "", description: "" })
    } catch (err) {
      setError("Failed to process contribution")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReferral = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="Group Contribution" onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64 border-none">
                <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {error && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">✕</button>
                </CardContent>
              </Card>
            )}

            {/* View: List All Groups / Landing Page */}
            {view === "list" && (
              <>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                  </div>
                ) : groups.length === 0 ? (
                  // Landing Page Design
                  <>
                    {/* Badge */}
                    <div className="flex justify-center mb-6">
                      <div className="inline-flex items-center gap-2 bg-emerald-50 border border-brand-green/20 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                        <span className="text-slate-600 text-sm font-medium">Free Premium Challenge Teamwork</span>
                      </div>
                    </div>

                    {/* Hero Section */}
                    <div className="text-center mb-8 md:mb-12">
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                        <span className="text-slate-900">Free Premium Challenge Teamwork — </span>
                        <span className="text-brand-green">Round-<br />Robin Bulk Saver</span>
                      </h1>
                      <p className="text-slate-600 text-base md:text-lg max-w-3xl mx-auto mb-6 md:mb-8">
                        A teamwork savings mode for <span className="font-semibold text-slate-900">up to 10 members</span>. Bulk contribution rotates member-to-member until everyone completes the cycle. <span className="font-semibold text-slate-900">Payout happens only after the full cycle is completed.</span>
                      </p>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                      {/* 5-10 Members Card */}
                      <Card className="border border-slate-200 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
                        <CardContent className="p-0 flex flex-col items-center text-center">
                          <div className="mb-4 p-3 bg-emerald-50 rounded-lg">
                            <Users className="w-8 h-8 text-brand-green" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Up to 10 members</h3>
                          <p className="text-slate-600 text-sm">
                            Small groups of up to 10 members, completing the full cycle in one year.
                          </p>
                        </CardContent>
                      </Card>

                      {/* Rotation Order Card */}
                      <Card className="border border-slate-200 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
                        <CardContent className="p-0 flex flex-col items-center text-center">
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <RotateCcw className="w-8 h-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Rotation order</h3>
                          <p className="text-slate-600 text-sm">
                            Bulk contribution rotates fairly until the last member completes their turn.
                          </p>
                        </CardContent>
                      </Card>

                      {/* Locked Payout Card */}
                      <Card className="border border-slate-200 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
                        <CardContent className="p-0 flex flex-col items-center text-center">
                          <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                            <Lock className="w-8 h-8 text-amber-600" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Locked payout</h3>
                          <p className="text-slate-600 text-sm">
                            No early cash-out: payout is released only at the end of the full cycle.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Info Box */}
                    <Card className="border border-slate-200 bg-white rounded-2xl p-6 md:p-8 mb-8 md:mb-12 shadow-sm">
                      <CardContent className="p-0">
                        <p className="text-slate-700 text-base text-center mb-3">
                          Best for friends, families, coworkers, or teams who want a structured "bulk-rotation" savings commitment.
                        </p>
                        <p className="text-slate-500 text-sm text-center">
                          Backend note: enforce membership limits, rotation order, and locked payout rules server-side.
                        </p>
                      </CardContent>
                    </Card>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button
                        onClick={() => setView("create")}
                        className="px-8 py-3 md:px-10 md:py-4 bg-brand-green hover:bg-brand-green/90 text-dark-navy rounded-xl font-semibold transition-colors text-base md:text-lg shadow-lg"
                      >
                        Join Teamwork Mode
                      </button>
                      <button
                        className="px-8 py-3 md:px-10 md:py-4 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-xl font-semibold transition-colors text-base md:text-lg bg-white"
                      >
                        Read FAQ
                      </button>
                    </div>
                  </>
                ) : (
                  // My Groups View
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-900">My Groups</h2>
                      <button
                        onClick={() => setView("create")}
                        className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-dark-navy px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        New Group
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {groups.map(group => (
                        <Card key={group.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                          setSelectedGroup(group)
                          setView("detail")
                        }}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{group.name}</h3>
                                <p className="text-slate-500 text-sm">{group.purpose}</p>
                              </div>
                              <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-xs font-semibold">{group.frequency}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Members</p>
                                <p className="text-lg font-bold text-slate-900">{group.members.length}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Balance</p>
                                <p className="text-lg font-bold text-brand-green">${group.balance}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-500 text-xs mb-1">Total</p>
                                <p className="text-lg font-bold text-slate-900">${group.totalContributed}</p>
                              </div>
                            </div>

                            <button className="w-full bg-brand-green/10 text-brand-green px-4 py-2 rounded-lg font-semibold hover:bg-brand-green/20 transition-colors">
                              View Details →
                            </button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* View: Create Group */}
            {view === "create" && (
              <>
                <button
                  onClick={() => setView("list")}
                  className="text-brand-green hover:text-brand-green/80 font-semibold mb-6"
                >
                  ← Back to Groups
                </button>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setView("create")}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${view === "create" ? "bg-brand-green text-dark-navy" : "bg-white text-slate-600 border border-slate-200"}`}
                  >
                    Create Group
                  </button>
                  <button
                    onClick={() => setView("join")}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${view === "join" ? "bg-brand-green text-dark-navy" : "bg-white text-slate-600 border border-slate-200"}`}
                  >
                    Join Group
                  </button>
                </div>

                {view === "create" && (
                  <Card className="bg-dark-navy text-white border-none overflow-hidden rounded-2xl p-6 md:p-10 mb-6">
                    <CardContent className="p-0">
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">Create a New Group</h2>
                      <p className="text-slate-400">Set up your group contribution plan and start saving together</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-none shadow-sm rounded-2xl p-6">
                  <CardContent className="p-0">
                    <form onSubmit={handleCreateGroup} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Group Name</label>
                        <input
                          type="text"
                          required
                          value={formData.groupName}
                          onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                          placeholder="e.g., Friends Circle, Family Fund"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Purpose</label>
                        <textarea
                          required
                          value={formData.purpose}
                          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                          placeholder="What is this group saving for?"
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Contribution Amount ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="10"
                            max="5000"
                            required
                            value={formData.contributionAmount}
                            onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                            placeholder="27.40"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                          />
                          <p className="text-xs text-slate-500 mt-1">Min: $10, Max: $5,000</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Frequency</label>
                          <select
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                          <p className="text-xs text-slate-500 mt-1">Group automatically locks at selected max members</p>
                        </div>
                      </div>

                      {/* New Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Max Members</label>
                          <input
                            type="number"
                            min="2"
                            max="50"
                            required
                            value={formData.maxMembers}
                            onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                          />
                          <p className="text-xs text-slate-500 mt-1">Default: 10</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Currency</label>
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Start Date</label>
                          <input
                            type="text"
                            readOnly
                            value={new Date().toLocaleDateString()}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                          />
                          <p className="text-xs text-slate-500 mt-1">Automatically set to today</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Closing Date (Strict Lock)</label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.closingDate}
                            onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                          />
                          <p className="text-xs text-slate-500 mt-1">Group PERMANENTLY locks on this date.</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Payout Order Rule</label>
                          <select
                            value={formData.payoutOrderRule}
                            onChange={(e) => setFormData({ ...formData, payoutOrderRule: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                          >
                            <option value="as-joined">As joined</option>
                            <option value="random">Random</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Rules / Notes</label>
                        <textarea
                          value={formData.rules}
                          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                          placeholder="Example: Payment due by Friday 6pm. Late fee $2. Payout delayed if less than 80% paid."
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-green hover:bg-brand-green/90 text-dark-navy px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : "Create Group"}
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}

            {/* View: Group Details */}
            {view === "detail" && selectedGroup && (
              <>
                <button
                  onClick={() => setView("list")}
                  className="text-brand-green hover:text-brand-green/80 font-semibold mb-6"
                >
                  ← Back to Groups
                </button>

                {/* Group Header */}
                <Card className="bg-dark-navy text-white border-none overflow-hidden rounded-2xl p-6 md:p-10 mb-6">
                  <CardContent className="p-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl md:text-3xl font-bold">{selectedGroup.name}</h2>
                          {selectedGroup.isLocked && (
                            <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 mb-4">{selectedGroup.purpose}</p>
                      </div>
                      <span className="bg-brand-green/20 text-brand-green px-4 py-2 rounded-full font-semibold">{selectedGroup.frequency}</span>
                    </div>

                    {/* Show dates if group is locked */}
                    {/* Show dates if group is locked OR has closing date */}
                    {(selectedGroup.isLocked || selectedGroup.closingDate) && (
                      <div className="border-t border-slate-700 pt-4 mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Start Date</p>
                            <p className="text-white font-semibold flex items-center gap-2">
                              {selectedGroup.startDate ? new Date(selectedGroup.startDate).toLocaleDateString() : 'Pending'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Closing Date</p>
                            <p className="text-amber-300 font-semibold flex items-center gap-2">
                              {selectedGroup.closingDate ? new Date(selectedGroup.closingDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Status</p>
                            {new Date() > new Date(selectedGroup.closingDate!) ? (
                              <span className="text-red-400 font-bold uppercase text-xs">Closed</span>
                            ) : selectedGroup.members.length >= selectedGroup.maxMembers ? (
                              <span className="text-amber-400 font-bold uppercase text-xs">Full</span>
                            ) : (
                              <span className="text-green-400 font-bold uppercase text-xs">Open</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Referral Section - only show if not locked */}
                    {!selectedGroup.isLocked && (
                      <div className="border-t border-slate-700 pt-4">
                        <p className="text-slate-400 text-sm mb-3">Invite Members with Referral Link</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            readOnly
                            value={selectedGroup.referralLink}
                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 text-sm font-mono"
                          />
                          <button
                            onClick={handleCopyReferral}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                          >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">Code: <span className="font-mono font-semibold text-brand-green">{selectedGroup.referralCode}</span></p>
                      </div>
                    )}

                    {/* Locked group message */}
                    {selectedGroup.isLocked && (
                      <div className="border-t border-slate-700 pt-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                          <p className="text-amber-300 text-sm flex items-center gap-2">
                            <Lock className="w-4 h-4 flex-shrink-0" />
                            This group is full ({selectedGroup.members.length}/{selectedGroup.maxMembers} members) and no longer accepting new members
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
                    <CardContent className="p-0 text-center">
                      <p className="text-slate-500 text-sm mb-1">Members</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {selectedGroup.members.length}/{selectedGroup.maxMembers}
                      </p>
                      {selectedGroup.isLocked && (
                        <p className="text-xs text-amber-600 mt-1 font-semibold">Full</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
                    <CardContent className="p-0 text-center">
                      <p className="text-slate-500 text-sm mb-1">Group Balance</p>
                      <p className="text-3xl font-bold text-brand-green">${selectedGroup.balance}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
                    <CardContent className="p-0 text-center">
                      <p className="text-slate-500 text-sm mb-1">Total Contributed</p>
                      <p className="text-3xl font-bold text-slate-900">${selectedGroup.totalContributed}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Left: Members & Contribute */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Members List */}
                    <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
                      <CardContent className="p-0">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-slate-900">Group Members</h3>
                          <button
                            onClick={() => setShowNewMemberModal(true)}
                            className="text-brand-green hover:text-brand-green/80 font-semibold flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" /> Add Member
                          </button>
                        </div>

                        <div className="space-y-3">
                          {selectedGroup.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                              <div>
                                <p className="font-semibold text-slate-900">{member.name}</p>
                                <p className="text-xs text-slate-500">{member.email}</p>
                                {member.referredBy && <p className="text-xs text-brand-green">Referred by {member.referredBy}</p>}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900">${member.totalContributed}</p>
                                <p className="text-xs text-slate-500">${member.contributionAmount} per {selectedGroup.frequency}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contribution Form */}
                    <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
                      <CardContent className="p-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Make a Contribution</h3>

                        {!selectedGroup.isLocked && (
                          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Contributions Paused</p>
                              <p className="text-sm mt-1">Contributions will begin when all {selectedGroup.maxMembers} members have joined. Currently {selectedGroup.members.length}/{selectedGroup.maxMembers}.</p>
                            </div>
                          </div>
                        )}

                        <form onSubmit={handleContribute} className="space-y-4">
                          <fieldset disabled={!selectedGroup.isLocked} className="space-y-4 opacity-100 disabled:opacity-50">
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">Amount ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={contributionData.amount}
                                onChange={(e) => setContributionData({ ...contributionData, amount: e.target.value })}
                                placeholder={selectedGroup.contributionAmount.toString()}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">Note (Optional)</label>
                              <input
                                type="text"
                                value={contributionData.description}
                                onChange={(e) => setContributionData({ ...contributionData, description: e.target.value })}
                                placeholder="e.g., Weekly savings"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-brand-green hover:bg-brand-green/90 text-dark-navy px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Send className="w-5 h-5" />
                              Contribute Now
                            </button>
                          </fieldset>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Summary */}
                  <div>
                    <Card className="border-none shadow-sm rounded-2xl p-6 bg-white sticky top-24">
                      <CardContent className="p-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Summary</h3>
                        <div className="space-y-4">
                          <div className="pb-4 border-b border-slate-200">
                            <p className="text-slate-500 text-sm mb-1">Per {selectedGroup.frequency} contribution</p>
                            <p className="text-2xl font-bold text-slate-900">${selectedGroup.contributionAmount}</p>
                          </div>

                          <div className="pb-4 border-b border-slate-200">
                            <p className="text-slate-500 text-sm mb-1">Expected payout</p>
                            <p className="text-lg font-bold text-brand-green">${(selectedGroup.contributionAmount * selectedGroup.members.length).toFixed(2)}</p>
                          </div>

                          <div>
                            <p className="text-slate-500 text-sm mb-1">Group status</p>
                            {new Date() > new Date(selectedGroup.closingDate!) ? (
                              <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Closed</span>
                            ) : selectedGroup.members.length >= selectedGroup.maxMembers ? (
                              <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">Full</span>
                            ) : (
                              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Open</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Transactions Section */}
                <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
                  <CardContent className="p-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Transactions</h3>
                    <div className="space-y-3">
                      {transactions.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No transactions yet</p>
                      ) : (
                        transactions.map((txn) => (
                          <div key={txn.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                                <ArrowRight className="w-5 h-5 text-brand-green" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 truncate">{txn.memberName}</p>
                                <p className="text-xs text-slate-500">{txn.description}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <p className="font-bold text-slate-900">${txn.amount}</p>
                              <p className="text-xs text-slate-500">{txn.date}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Join Group Modal */}
      <Sheet open={showNewMemberModal} onOpenChange={setShowNewMemberModal}>
        <SheetContent side="right" className="w-full sm:w-96">
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-2">Join Group</h2>
            <p className="text-slate-500 mb-6">Enter the referral code to join this group</p>

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Referral Code</label>
                <input
                  type="text"
                  required
                  value={joinData.referralCode}
                  onChange={(e) => setJoinData({ referralCode: e.target.value })}
                  placeholder="e.g., FC2024"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-dark-navy px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : "Join Group"}
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
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

