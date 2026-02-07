"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { ChevronDown, ChevronUp, Search } from "lucide-react"

function FAQContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0)
    const [searchQuery, setSearchQuery] = useState("")

    const faqs = [
        {
            category: "Getting Started",
            questions: [
                {
                    q: "How does the $27.40 challenge work?",
                    a: "Save $27.40 every day for 365 days to reach $10,000. We automatically deduct this amount from your connected payment method and add it to your secure wallet. Track your progress, build streaks, and withdraw anytime."
                },
                {
                    q: "Can I choose different saving amounts?",
                    a: "Yes! You can use multipliers from 1x to 10x. For example, with a 2x multiplier, you'd save $54.80/day to reach $20,000 in a year. You can also choose weekly or monthly frequencies instead of daily."
                },
                {
                    q: "Is my money safe?",
                    a: "Absolutely. Your funds are stored in a secure, regulated wallet. We use bank-level encryption and comply with all financial regulations. You can withdraw your money anytime."
                }
            ]
        },
        {
            category: "Payments & Wallet",
            questions: [
                {
                    q: "What payment methods can I use?",
                    a: "We accept bank accounts (via ACH) and credit/debit cards. You can connect multiple payment methods and choose which one to use for auto-debit."
                },
                {
                    q: "When will money be deducted?",
                    a: "For daily challenges, we deduct at the same time each day. For weekly/monthly, you choose the deduction day. You'll receive notifications before each transaction."
                },
                {
                    q: "Can I withdraw my savings anytime?",
                    a: "Yes! Your wallet balance is available for withdrawal at any time. Withdrawals typically take 1-3 business days to reach your bank account."
                },
                {
                    q: "What if a payment fails?",
                    a: "If auto-debit fails, we'll retry once after 24 hours. You'll receive notifications and can manually add funds to catch up. Your streak won't be affected if you catch up within 48 hours."
                }
            ]
        },
        {
            category: "Streaks & Progress",
            questions: [
                {
                    q: "What happens if I miss a day?",
                    a: "Your streak will reset, but your savings remain intact. You can restart your streak anytime and continue saving. We encourage consistency, but understand life happens!"
                },
                {
                    q: "How are achievements earned?",
                    a: "Earn badges for milestones like 7-day streaks, 30-day streaks, $1000 saved, multiplier challenges, and more. Check your Achievements page to see all available rewards."
                },
                {
                    q: "Can I pause my challenge?",
                    a: "Yes, you can pause auto-debit in your settings. Your wallet balance remains safe, but your streak will pause. Resume anytime to continue building your savings."
                }
            ]
        },
        {
            category: "Groups & Referrals",
            questions: [
                {
                    q: "How do group contributions work?",
                    a: "Create or join a savings group (5-10 people). Each member contributes to a shared pool in rotation. Payouts happen only after the full cycle completes. Perfect for friends and family saving together!"
                },
                {
                    q: "What's the referral program?",
                    a: "Share your unique referral link. When friends sign up and complete their first week, you both earn bonuses ($10-$50 depending on promotion). There's no limit to how many people you can refer."
                },
                {
                    q: "Can I be in multiple groups?",
                    a: "Yes, you can participate in multiple group challenges simultaneously. Each group has its own balance and contribution schedule."
                }
            ]
        },
        {
            category: "Account & Security",
            questions: [
                {
                    q: "Why do I need to verify my identity (KYC)?",
                    a: "To comply with financial regulations and protect your account, we require identity verification for withdrawals above $1,000. It's a simple process that takes 2-3 minutes."
                },
                {
                    q: "Can I change my multiplier later?",
                    a: "Yes, but only at the start of a new challenge period (daily, weekly, or monthly). Your current challenge period must complete first."
                },
                {
                    q: "How do I delete my account?",
                    a: "Go to Settings > Account Security > Delete Account. You must withdraw all funds first. Account deletion is permanent and cannot be undone."
                }
            ]
        },
        {
            category: "Subscription & Fees",
            questions: [
                {
                    q: "Is there a subscription fee?",
                    a: "We offer a free tier with basic features. Premium subscription ($4.99/month) unlocks multipliers above 5x, group challenges, priority support, and advanced analytics."
                },
                {
                    q: "Are there withdrawal fees?",
                    a: "First 3 withdrawals per month are free. Additional withdrawals have a small fee ($1.50). Premium subscribers get unlimited free withdrawals."
                },
                {
                    q: "Can I cancel my premium subscription?",
                    a: "Yes, cancel anytime in Settings. You'll keep premium benefits until the end of your billing period. No refunds for partial months."
                }
            ]
        }
    ]

    const filteredFAQs = faqs.map(category => ({
        ...category,
        questions: category.questions.filter(faq =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="FAQ / Help Center" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">

                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
                            <p className="text-lg text-slate-600">Find answers to common questions about Save2740</p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                        </div>

                        {/* FAQ Categories */}
                        {filteredFAQs.length > 0 ? (
                            filteredFAQs.map((category, catIndex) => (
                                <div key={catIndex} className="space-y-4">
                                    <h2 className="text-2xl font-bold text-slate-900">{category.category}</h2>
                                    {category.questions.map((faq, qIndex) => {
                                        const globalIndex = catIndex * 100 + qIndex
                                        const isExpanded = expandedIndex === globalIndex

                                        return (
                                            <Card key={qIndex} className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:border-brand-green/30 transition-colors">
                                                <button
                                                    onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                                                    className="w-full text-left"
                                                >
                                                    <CardContent className="p-6">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <h3 className="text-lg font-semibold text-slate-900">{faq.q}</h3>
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-5 h-5 text-brand-green flex-shrink-0" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        {isExpanded && (
                                                            <p className="text-slate-600 mt-4 leading-relaxed">{faq.a}</p>
                                                        )}
                                                    </CardContent>
                                                </button>
                                            </Card>
                                        )
                                    })}
                                </div>
                            ))
                        ) : (
                            <Card className="border border-slate-200 shadow-sm rounded-2xl">
                                <CardContent className="p-8 text-center">
                                    <p className="text-slate-600">No questions match your search. Try different keywords.</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Still have questions */}
                        <Card className="border-2 border-brand-green bg-emerald-50 rounded-2xl">
                            <CardContent className="p-8 text-center">
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Still have questions?</h3>
                                <p className="text-slate-700 mb-6">
                                    Can't find what you're looking for? Our support team is here to help!
                                </p>
                                <button
                                    onClick={() => window.location.href = '/contact'}
                                    className="bg-brand-green hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Contact Support
                                </button>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </main>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-64 border-none">
                    <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default function FAQPage() {
    return (
        <ProtectedPage>
            <FAQContent />
        </ProtectedPage>
    )
}

