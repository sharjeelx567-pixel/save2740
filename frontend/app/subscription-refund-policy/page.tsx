"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

function SubscriptionRefundPolicyContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Subscription & Refund Policy" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-6">

                        <div className="mb-8">
                            <h1 className="hidden lg:block text-2xl md:text-3xl font-bold text-slate-900 mb-2">Subscription & Refund Policy</h1>
                            <p className="text-slate-600">Last updated: January 8, 2026</p>
                        </div>

                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8 prose prose-slate prose-compact max-w-none">

                                <h2>Premium Subscription</h2>

                                <h3>1. Subscription Plans</h3>
                                <ul>
                                    <li><strong>Free:</strong> Basic features, multipliers up to 5x, limited achievements</li>
                                    <li><strong>Premium Monthly:</strong> $4.99/month - All features, unlimited multipliers, group challenges, priority support</li>
                                    <li><strong>Premium Annual:</strong> $49.99/year (Save 17%)</li>
                                </ul>

                                <h3>2. Premium Features</h3>
                                <p>Multipliers 1x-10x (vs 1x-5x free), unlimited group challenges, unlimited free withdrawals (vs 3/month), advanced analytics, priority support (24-hour), exclusive badges, early feature access, ad-free.</p>

                                <h3>3. Billing</h3>
                                <p>Auto-renewal until canceled. Charged to default payment method. Monthly: every 30 days. Annual: every 365 days. Price changes: 30 days' notice. Failed payments: retry 3 times over 7 days before suspension.</p>

                                <h3>4. Free Trial</h3>
                                <p>7-day trial for new users. Cancel anytime during trial. One trial per user (email + payment method).</p>

                                <h3>5. Cancellation</h3>
                                <p>Cancel via Settings → Subscription or email support@save2740.app (subject: "Cancel Subscription"). Effect: end of billing period. Premium access retained until period ends. No partial refunds; access continues through paid period.</p>

                                <h2>Refund Policy</h2>

                                <h3>6. Subscription Refunds</h3>
                                <p><strong>General Policy:</strong> Non-refundable except: billing errors (wrong amount, duplicates), technical issues (premium features unavailable 3+ days), first-time subscribers (request within 48 hours, one-time), unauthorized charges (compromised account).</p>
                                <p><strong>Not Eligible:</strong> Changed mind after using features, forgot to cancel before renewal, didn't use features voluntarily, account suspended for violations.</p>

                                <h3>7. Wallet Contributions Refund Policy</h3>
                                <p><strong>Important:</strong> Challenge contributions are NOT refundable once processed (daily/weekly/monthly contributions, group deposits, manual deposits).</p>
                                <p><strong>Alternative:</strong> Withdraw wallet balance anytime (subject to withdrawal policy). Savings remain accessible.</p>
                                <p><strong>Exception:</strong> Duplicate or erroneous technical errors refunded within 5-7 business days.</p>

                                <h3>8. Group Challenge Refunds</h3>
                                <ul>
                                    <li>Group contributions are locked until cycle completion</li>
                                    <li>No refunds while the group cycle is active</li>
                                    <li>If a group member defaults, remaining members may vote to dissolve the group and reclaim prorated contributions</li>
                                    <li>Admin fees are non-refundable even if group dissolves</li>
                                </ul>

                                <h3>9. How to Request a Refund</h3>
                                <p>Email refunds@save2740.app within 30 days. Include: account email, transaction ID/date, reason, supporting documentation. Review: 5 business days. Processing: 7-10 business days.</p>

                                <h3>10. Refund Methods</h3>
                                <p>Refunds issued to original payment method (or wallet if unavailable). Processing: 3-10 business days.</p>

                                <h3>11. Chargebacks</h3>
                                <p><strong>Important:</strong> Contact us before filing chargebacks to avoid account suspension. Unjustified chargebacks may result in permanent termination and forfeiture of wallet balance.</p>

                                <h3>12. Promotional Offers</h3>
                                <p>Promotional pricing not retroactive. Offers cannot be combined unless stated. Promo codes expire as indicated. We reserve right to modify or cancel promotions.</p>

                                <h3>13. Changes to Subscription Plans</h3>
                                <p>We may modify tiers, features, or pricing with 30 days' notice. Existing subscribers grandfathered at current pricing for 6 months.</p>

                                <h3>14. Account Credits</h3>
                                <p>May be offered in lieu of refunds. Applied to future subscriptions/wallet deposits. Non-transferable, non-cashable, non-expiring. Forfeited if account closed.</p>

                                <h3>15. Contact Us</h3>
                                <p>Refunds: refunds@save2740.app | Billing: support@save2740.app | Phone: 1-800-SAVE-274</p>

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

export default function SubscriptionRefundPolicyPage() {
    return (
        <ProtectedPage>
            <SubscriptionRefundPolicyContent />
        </ProtectedPage>
    )
}

