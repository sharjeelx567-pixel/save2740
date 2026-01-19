"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

function AffiliateReferralPolicyContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Affiliate / Referral Policy" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-6">

                        <div className="mb-8">
                            <h1 className="hidden lg:block text-2xl md:text-3xl font-bold text-slate-900 mb-2">Affiliate / Referral Policy</h1>
                            <p className="text-slate-600">Last updated: January 8, 2026</p>
                        </div>

                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8 prose prose-slate prose-compact max-w-none">

                                <h2>Referral Program</h2>

                                <h3>1. How It Works</h3>
                                <p>Get your unique referral link from the Referrals section. Share via email, social media, or messaging. Both you and your referral earn bonuses when they complete qualifying actions.</p>

                                <h3>2. Referral Rewards</h3>
                                <p><strong>Standard:</strong> Referrer $10, Referred $5 (after first week completion).</p>
                                <p><strong>Premium:</strong> Referrer $15, Referred $10.</p>
                                <p><strong>Qualifying Actions:</strong> Create account with your link, verify email, connect payment method, complete 7 consecutive days of savings, minimum $50 wallet balance after first week.</p>

                                <h3>3. Bonus Payout</h3>
                                <p>Credited to wallet within 48 hours. Minimum $10 to withdraw. Use for challenges, withdraw, or keep. Tax forms (1099) if annual bonuses exceed $600.</p>

                                <h3>4. Referral Limits</h3>
                                <p>Free users: 10/month. Premium: Unlimited. Annual cap: $5,000 per calendar year.</p>

                                <h3>5. Prohibited Practices</h3>
                                <p>Prohibited (results in suspension and bonus forfeiture): Self-referrals, fake accounts, spam, false advertising, unauthorized paid ads, external incentives for signups, domain squatting, trademark misuse.</p>

                                <h3>6. Promotional Campaigns</h3>
                                <p>Limited-time promotions announced via email/in-app. Terms vary. Standard program terms apply unless stated otherwise.</p>

                                <h2>Affiliate Program</h2>

                                <h3>7. Who Can Join</h3>
                                <p>Invite-only for financial bloggers, content creators, personal finance influencers, financial coaches/advisors, budgeting platforms. Apply: email affiliates@save2740.app with platform details and audience demographics.</p>

                                <h3>8. Commission Structure</h3>
                                <ul>
                                    <li>Per verified signup: $3</li>
                                    <li>Per active user (30 days consecutive saving): $20</li>
                                    <li>Premium conversion: 20% of first month ($1)</li>
                                    <li>Recurring: 5% on premium subscriptions for 12 months</li>
                                </ul>

                                <h3>9. Affiliate Requirements</h3>
                                <p>Must disclose affiliate relationship (FTC compliance), use approved materials or get pre-approval, maintain brand integrity, provide monthly traffic/conversion reports, avoid prohibited marketing practices.</p>

                                <h3>10. Payouts</h3>
                                <p>Minimum: $100. Schedule: Monthly (NET-30). Methods: Bank transfer, PayPal, check. Tax forms: W-9 (US), W-8BEN (international).</p>

                                <h3>11. Tracking</h3>
                                <p>30-day cookie duration. Last-click attribution. Real-time dashboard. Monthly detailed reports.</p>

                                <h3>12. Termination</h3>
                                <p>Termination grounds: policy violations, fraud, brand damage, 6+ months inactivity. Upon termination: commissions &gt;$100 paid, &lt;$100 may forfeit, dashboard access revoked.</p>

                                <h3>13. Intellectual Property</h3>
                                <p>Limited license to use Save2740 name/logos. Promotional materials remain Save2740 property. No modifications or derivative works. License terminates on exit.</p>

                                <h3>14. Compliance</h3>
                                <p>Must comply with: FTC Endorsement Guidelines (disclosure), CAN-SPAM Act, GDPR (EU privacy), CCPA (California privacy), all applicable local laws.</p>

                                <h3>15. Program Changes</h3>
                                <p>We reserve right to modify, suspend, or terminate programs with 30 days' notice. Commission structure changes do not affect accrued earnings.</p>

                                <h3>16. Contact</h3>
                                <p>Referral: support@save2740.app | Affiliate: affiliates@save2740.app | Applications: affiliates@save2740.app</p>

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

export default function AffiliateReferralPolicyPage() {
    return (
        <ProtectedPage>
            <AffiliateReferralPolicyContent />
        </ProtectedPage>
    )
}
