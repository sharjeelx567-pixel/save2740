"use client"

import { useState, useEffect } from "react"
import {
  Gem,
  CheckCircle2,
  UtensilsCrossed,
  Grid2x2,
  Users,
  Lock,
  ShieldCheck,
  Settings,
  X,
  CreditCard,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { WalletBalance } from "@/components/wallet-balance"
import { LogoutModal } from "@/components/logout-modal"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfile } from "@/hooks/use-profile"

// Custom Dashboard Icon Component
const DashboardIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/dashboard-icon.png"
      alt="Dashboard"
      width={24}
      height={24}
      priority
    />
  </div>
)

// Custom Wallet Icon Component
const WalletIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/wallet-icon.png"
      alt="Wallet"
      width={24}
      height={24}
      priority
    />
  </div>
)

// Custom Transaction Icon Component
const TransactionIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/transaction-icon.png"
      alt="Transaction"
      width={24}
      height={24}
      priority
    />
  </div>
)

// Custom Achievements Icon Component
const AchievementsIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/achievements-icon.png"
      alt="Achievements"
      width={24}
      height={24}
    />
  </div>
)

// Custom Saver Pockets Icon Component
const SaverPocketsIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/saver-pockets-icon.png"
      alt="Saver Pockets"
      width={24}
      height={24}
    />
  </div>
)

// Custom Referrals Icon Component
const ReferralsIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/referrals-icon.png"
      alt="Referrals"
      width={24}
      height={24}
    />
  </div>
)

// Custom Subscription Icon Component
const SubscriptionIcon = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/subscription-icon.png"
      alt="Subscription"
      width={24}
      height={24}
    />
  </div>
)

// Custom Group Contribution Icon Component (SVG)
const GroupContributionIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="7" r="4" fill="currentColor"></circle>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const navItems = [
  { icon: DashboardIcon, label: "Dashboard", href: "/", isDashboard: true },
  { icon: WalletIcon, label: "My Wallet", href: "/my-wallet", isWallet: true },
  { icon: SaverPocketsIcon, label: "Saver Pockets", href: "/saver-pockets" },
  { icon: GroupContributionIcon, label: "Group Contribution", href: "/group-contribution" },
  { icon: ReferralsIcon, label: "Referrals", href: "/referrals" },
  { icon: TransactionIcon, label: "My Transactions", href: "/wallet-transactions" },
  { icon: SubscriptionIcon, label: "Subscription", href: "/subscription" },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { profile: user, loading } = useProfile()
  const [showScrollUp, setShowScrollUp] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(false)
  // Removed manual fetchUser useEffect as useProfile handles it

  // Update scroll button visibility
  const updateScrollButtons = (element: HTMLElement) => {
    if (!element) return
    const { scrollTop, scrollHeight, clientHeight } = element
    setShowScrollUp(scrollTop > 20)
    setShowScrollDown(scrollTop + clientHeight < scrollHeight - 20)
  }

  const handleScroll = (direction: 'up' | 'down') => {
    const nav = document.getElementById('sidebar-nav')
    if (!nav) return
    const scrollAmount = direction === 'up' ? -200 : 200
    nav.scrollBy({ top: scrollAmount, behavior: 'smooth' })
  }

  return (
    <div className="w-full lg:w-64 bg-white h-full flex flex-col border-r border-slate-100">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <div style={{ width: '140px', height: '56px', overflow: 'hidden' }}>
              <img
                src="/logo.png"
                alt="Save2740 Logo"
                className="h-10 sm:h-12 md:h-14 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Container with Scroll Buttons */}
      <div className="flex-1 relative overflow-hidden">
        {/* Scroll Up Button */}
        {showScrollUp && (
          <button
            onClick={() => handleScroll('up')}
            className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white via-white to-transparent py-2 flex justify-center items-center text-slate-600 hover:text-brand-green transition-colors"
            aria-label="Scroll up"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 12l-5-5-5 5" />
            </svg>
          </button>
        )}

        {/* Navigation - Scrollable */}
        <nav
          id="sidebar-nav"
          className="h-full overflow-y-auto custom-scrollbar px-3 sm:px-4 md:px-6 space-y-0.5 sm:space-y-1 md:space-y-2 pb-4"
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            sessionStorage.setItem('sidebar-scroll', target.scrollTop.toString());
            updateScrollButtons(target);
          }}
          ref={(el) => {
            if (el) {
              // Restore scroll position immediately on mount
              const savedScroll = sessionStorage.getItem('sidebar-scroll');
              if (savedScroll) {
                el.scrollTop = parseInt(savedScroll, 10);
              }
              // Initial check for scroll buttons
              updateScrollButtons(el);
            }
          }}
        >
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 px-1 sm:px-1.5 md:px-2 py-1.5 sm:py-2 md:py-3 rounded-lg md:rounded-xl transition-colors text-xs sm:text-sm md:text-base",
                  isActive ? "bg-emerald-50 text-brand-green font-medium shadow-sm" : "text-slate-500",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.isDashboard ? (
                  <item.icon className="w-4 h-4 sm:w-5 md:w-5 h-4 md:h-5 shrink-0" />
                ) : (
                  <item.icon className="w-4 h-4 sm:w-5 md:w-5 h-4 md:h-5 shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}

          {/* Useful Links Section */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-2 sm:px-3 md:px-4 mb-2">
              Useful Links
            </h3>
            <div className="space-y-1">
              <Link
                href="/privacy-policy"
                onClick={onClose}
                prefetch={true}
                className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 hover:text-brand-green transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-conditions"
                onClick={onClose}
                prefetch={true}
                className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 hover:text-brand-green transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/savings-challenge-disclaimer"
                onClick={onClose}
                prefetch={true}
                className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 hover:text-brand-green transition-colors"
              >
                Savings Challenge Disclaimer
              </Link>
              <Link
                href="/subscription-refund-policy"
                onClick={onClose}
                prefetch={true}
                className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 hover:text-brand-green transition-colors"
              >
                Subscription & Refund Policy
              </Link>
              <Link
                href="/affiliate-referral-policy"
                onClick={onClose}
                prefetch={true}
                className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 hover:text-brand-green transition-colors"
              >
                Affiliate / Referral Policy
              </Link>
            </div>
          </div>
        </nav>

        {/* Scroll Down Button */}
        {showScrollDown && (
          <button
            onClick={() => handleScroll('down')}
            className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent py-2 flex justify-center items-center text-slate-600 hover:text-brand-green transition-colors"
            aria-label="Scroll down"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer Section - Fixed at Bottom */}
      {/* KYC Section - Fixed above footer */}
      <div className="flex-shrink-0 px-3 sm:px-4 pb-2">
        <Link href="/profile?tab=kyc" onClick={onClose} prefetch={true}>
          <img
            src="/kyc-button.png"
            alt="KYC Required"
            className="h-auto max-h-10 object-contain hover:opacity-90 transition-opacity cursor-pointer"
          />
        </Link>
      </div>

      {/* Footer Section - Fixed at Bottom */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-100 space-y-2 sm:space-y-3">
        <div className="space-y-2 sm:space-y-3">
          <Link href="/profile" onClick={onClose} prefetch={true} className="flex-1 min-w-0 block">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-emerald-100 transition-all cursor-pointer group">
              <Avatar className="h-10 w-10 min-w-[2.5rem] border-2 border-white shadow-sm ring-1 ring-slate-100 shrink-0">
                <AvatarImage src={user?.profilePicture?.url} alt={`${user?.firstName} ${user?.lastName}`} className="object-cover" />
                <AvatarFallback className="bg-brand-green text-white font-medium">
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left overflow-hidden">
                <div className="flex items-center gap-2 mt-2">
                  <p className="font-bold text-xs sm:text-sm text-emerald-500 truncate leading-snug">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                  </p>
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 transition-colors shrink-0 mt-1" />
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-[#7C8DB5] truncate mt-0.5">
                  {user?.accountTier ? `${user.accountTier.charAt(0).toUpperCase() + user.accountTier.slice(1)} member` : 'Basic member'}
                </p>
              </div>
            </div>
          </Link>

          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg md:rounded-xl transition-all text-sm sm:text-base text-red-600 hover:bg-red-50 w-full font-medium border border-red-200 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>

        <LogoutModal open={logoutOpen} onOpenChange={setLogoutOpen} />
      </div>
    </div>
  )
}
