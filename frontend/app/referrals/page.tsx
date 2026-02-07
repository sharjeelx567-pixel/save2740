"use client"

import { useState } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { Copy, Check, Loader2, AlertCircle } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useReferrals } from "@/hooks/use-referrals"

function ReferralsPageContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { referralLink, friendsInvited, totalEarnings, loading, error, refetch } = useReferrals()

  const handleCopy = () => {
    if (referralLink && referralLink !== '') {
      navigator.clipboard.writeText(referralLink)
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
        <DashboardHeader title="Referrals" onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-64 border-none">
                <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
              </div>
            ) : error ? (
              /* Error State */
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <AlertCircle className="w-12 h-12 text-red-600 mb-3" />
                  <p className="text-red-800 font-semibold mb-2">Error Loading Referral Data</p>
                  <p className="text-red-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={refetch}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Hero Section */}
                <Card className="bg-dark-navy text-white border-none overflow-hidden rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 lg:p-12">
                  <CardContent className="flex flex-col items-center text-center p-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 max-w-2xl leading-tight">Invite Friends, Get Paid</h2>
                    <p className="text-slate-400 text-xs sm:text-sm md:text-base mb-4 sm:mb-6 md:mb-10 max-w-xl px-2">
                      Earn $5.00 in wallet credits for every friend who joins the $27.40 challenge and completes their first
                      week.
                    </p>

                    <div className="w-full max-w-md space-y-3 sm:space-y-4 px-2 sm:px-4 md:px-0">
                      <p className="text-brand-green font-semibold text-xs md:text-sm">Your Referral Link</p>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex-1 w-full bg-slate-900/50 border border-brand-green/30 rounded-lg md:rounded-xl px-2 sm:px-4 py-2 md:py-3 text-slate-300 text-xs md:text-sm truncate font-mono">
                          {referralLink || 'Loading...'}
                        </div>
                        <button
                          onClick={handleCopy}
                          disabled={!referralLink}
                          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg md:rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 shrink-0 shadow-lg text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {copied ? <Check className="w-3 h-3 sm:w-4 md:w-4 sm:h-4 md:h-4 text-brand-green" /> : <Copy className="w-3 h-3 sm:w-4 md:w-4 sm:h-4 md:h-4" />}
                          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                          <span className="sm:hidden text-xs">{copied ? "✓" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <Card className="border-none shadow-sm rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 bg-white">
                    <CardContent className="p-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">{friendsInvited}</span>
                      <span className="text-slate-400 text-xs md:text-sm font-medium">Friends Invited</span>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 bg-white">
                    <CardContent className="p-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">${totalEarnings.toFixed(2)}</span>
                      <span className="text-slate-400 text-xs md:text-sm font-medium">Earned</span>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ReferralsPage() {
  return (
    <ProtectedPage>
      <ReferralsPageContent />
    </ProtectedPage>
  )
}

