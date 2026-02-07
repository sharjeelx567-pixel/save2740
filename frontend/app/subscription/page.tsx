"use client"

import { ProtectedPage } from "@/components/protected-page"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
}

interface BillingItem {
  date: Date
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  transactionId?: string
}

interface SubscriptionData {
  planType: 'yearly' | 'monthly' | 'lifetime'
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  appFee: number
  accruedFees: number
  startDate: Date
  endDate: Date
  nextBillingDate?: Date
  billingHistory: BillingItem[]
}

function SubscriptionPageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setSubscription(data.data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch subscription",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Subscription fetch error:', error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API.BASE_URL}/api/subscription/export-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Billing history exported successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to export billing history",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('CSV export error:', error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="Subscription & Billing" onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
          ) : subscription ? (
            <>
              {/* Active Subscription Card */}
              <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 bg-brand-green rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 sm:w-7 md:w-10 sm:h-7 md:h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
                          {subscription.planType === 'yearly' ? 'Yearly Challenge' : subscription.planType === 'monthly' ? 'Monthly Plan' : 'Lifetime Plan'}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1">
                          App Fee: ${subscription.appFee.toFixed(2)} / {subscription.planType === 'yearly' ? 'Year' : subscription.planType === 'monthly' ? 'Month' : 'Lifetime'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border ${
                      subscription.status === 'active' 
                        ? 'bg-emerald-50 text-brand-green border-emerald-200'
                        : subscription.status === 'cancelled'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>

                  {/* Billing Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 pt-4 sm:pt-6 border-t border-slate-100">
                    <div className="pt-3 sm:pt-4 md:pt-6">
                      <p className="text-slate-500 text-xs md:text-sm font-medium mb-1 md:mb-2">Next Billing Event</p>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                        {subscription.nextBillingDate 
                          ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Withdrawal Maturity'}
                      </p>
                    </div>
                    <div className="pt-3 sm:pt-4 md:pt-6">
                      <p className="text-slate-500 text-xs md:text-sm font-medium mb-1 md:mb-2">Accrued App Fees</p>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800">
                        ${subscription.accruedFees.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing History Section */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Billing History</h2>
                  <button 
                    onClick={exportCSV}
                    className="text-brand-green text-xs sm:text-sm font-semibold hover:underline flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                </div>

                <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {subscription.billingHistory.length > 0 ? (
                        subscription.billingHistory.map((item, index) => (
                          <div
                            key={index}
                            className="p-4 md:p-6 flex items-start justify-between hover:bg-slate-50 transition-colors gap-4"
                          >
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                item.status === 'completed' 
                                  ? 'bg-emerald-50'
                                  : item.status === 'pending'
                                  ? 'bg-yellow-50'
                                  : 'bg-red-50'
                              }`}>
                                <CheckCircle2 className={`w-5 h-5 md:w-6 md:h-6 ${
                                  item.status === 'completed'
                                    ? 'text-brand-green'
                                    : item.status === 'pending'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm md:text-base font-semibold text-slate-800">{item.description}</p>
                                <p className="text-xs md:text-sm text-slate-500 mt-1">
                                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm md:text-base font-semibold text-slate-700 whitespace-nowrap text-right">
                              ${item.amount.toFixed(2)} {item.status === 'pending' && '(Deferred)'}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          No billing history yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-600">No subscription found</p>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <ProtectedPage>
      <SubscriptionPageContent />
    </ProtectedPage>
  )
}

