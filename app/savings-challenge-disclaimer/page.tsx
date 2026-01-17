"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { AlertTriangle } from "lucide-react"

function SavingsChallengeDisclaimerContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Savings Challenge Disclaimer" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-6">

                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Savings Challenge Disclaimer</h1>
                            <p className="text-slate-600">Last updated: January 8, 2026</p>
                        </div>

                        <Card className="border-2 border-amber-200 bg-amber-50 rounded-2xl">
                            <CardContent className="p-6 flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-2">Important Notice</h3>
                                    <p className="text-slate-700 text-sm">
                                        Please read this disclaimer carefully before participating in any Save2740 savings challenge. By enrolling, you acknowledge and accept these terms.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8 prose prose-slate prose-compact max-w-none">

                                <h2>1. No Guaranteed Returns</h2>
                                <p>Save2740 is a <strong>savings tool</strong>, not an investment platform. No returns beyond principal. Savings do not earn interest or investment returns.</p>
                                <p><strong>What you save is what you get.</strong> Saving $27.40/day for 365 days = ~$10,000 (minus fees).</p>

                                <h2>2. Not Financial Advice</h2>
                                <p>Save2740 does not provide financial, investment, or tax advice. Challenges are educational tools. Consult a financial advisor, ensure affordability, consider personal circumstances, and understand tax implications.</p>

                                <h2>3. Personal Responsibility</h2>
                                <p>
                                    <strong>You are solely responsible for:</strong>
                                </p>
                                <ul>
                                    <li>Determining whether a savings challenge is appropriate for your financial situation</li>
                                    <li>Ensuring sufficient funds in your payment method for automatic deductions</li>
                                    <li>Managing your budget to accommodate challenge contributions</li>
                                    <li>Monitoring your progress and wallet balance</li>
                                    <li>Understanding and accepting the risks of automated payments</li>
                                </ul>

                                <h2>4. Payment Risks</h2>
                                <ul>
                                    <li><strong>Overdraft Fees:</strong> Insufficient funds may incur bank overdraft fees (Save2740 not responsible)</li>
                                    <li><strong>Failed Payments:</strong> Repeated failures may pause or terminate your challenge</li>
                                    <li><strong>Payment Method Issues:</strong> Expired cards or closed accounts cause failures</li>
                                    <li><strong>Bank Delays:</strong> Transfers may take 1-3 business days</li>
                                </ul>

                                <h2>5. Streak and Challenge Commitment</h2>
                                <ul>
                                    <li>Streaks are motivational tools and do not affect your actual savings amount</li>
                                    <li>Missed days will reset your streak but your money remains safe</li>
                                    <li>You can pause or cancel challenges, but may lose streak progress</li>
                                    <li>Challenge completion is voluntary - you can withdraw at any time</li>
                                </ul>

                                <h2>6. Group Contribution Risks</h2>
                                <ul>
                                    <li>Payout depends on all members completing contributions</li>
                                    <li>Member defaults may delay or affect payouts</li>
                                    <li>Funds locked until full cycle completes</li>
                                    <li>Only join groups with people you trust</li>
                                    <li>Save2740 cannot guarantee group member performance</li>
                                </ul>

                                <h2>7. Withdrawal Limitations</h2>
                                <ul>
                                    <li>Withdrawals require identity verification (KYC) for amounts over $1,000</li>
                                    <li>Processing time is typically 1-3 business days (may be longer for large amounts)</li>
                                    <li>We reserve the right to delay suspicious withdrawals for security review</li>
                                    <li>Withdrawal fees apply after the first 3 free withdrawals per month</li>
                                    <li>Group challenge funds cannot be withdrawn until cycle completion</li>
                                </ul>

                                <h2>8. Service Availability</h2>
                                <p>We strive for 24/7 availability but service may be unavailable due to maintenance or technical issues. We are not liable for losses from service interruptions. Scheduled maintenance announced when possible; emergency maintenance may occur without notice.</p>

                                <h2>9. No FDIC Insurance</h2>
                                <p><strong>Important:</strong> Funds in your Save2740 wallet are <strong>not FDIC insured</strong>. Savings are held in a stored value account, not a traditional bank account. While we use secure banking partners, wallet balances are not covered by federal deposit insurance.</p>

                                <h2>10. Tax Implications</h2>
                                <ul>
                                    <li>You are responsible for reporting any applicable taxes on your savings</li>
                                    <li>Referral bonuses may be considered taxable income</li>
                                    <li>Interest (if any) on wallet balances may be taxable</li>
                                    <li>Consult a tax professional for guidance on your specific situation</li>
                                    <li>Save2740 may issue tax forms (e.g., 1099) where required by law</li>
                                </ul>

                                <h2>11. Change of Terms</h2>
                                <p>We reserve the right to modify challenge parameters (30 days' notice), adjust fees (advance notification), discontinue challenges/features, and change eligibility. Active challenges honored under enrollment terms unless changes required by law.</p>

                                <h2>12. Limitation of Liability</h2>
                                <p>Save2740's liability is limited to your wallet balance. We are not liable for indirect, incidental, or consequential damages; lost profits; emotional distress; third-party actions (bank fees, processor issues); or force majeure events.</p>

                                <h2>13. User Acknowledgment</h2>
                                <p>By participating, you acknowledge: (1) Read and understood this disclaimer, (2) Understand savings do not earn guaranteed returns, (3) Accept responsibility for financial decisions, (4) Understand risks of automated payments and group challenges, (5) Consulted financial advisors if needed, (6) Can afford the challenge without financial hardship.</p>

                                <h2>14. Questions or Concerns</h2>
                                <p>Email: legal@save2740.app | Support: support@save2740.app | Phone: 1-800-SAVE-274</p>

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

export default function SavingsChallengeDisclaimerPage() {
    return (
        <ProtectedPage>
            <SavingsChallengeDisclaimerContent />
        </ProtectedPage>
    )
}
