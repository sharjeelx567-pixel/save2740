"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

function TermsContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Terms & Conditions" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-6">

                        <div className="mb-8">
                            <h1 className="hidden lg:block text-2xl md:text-3xl font-bold text-slate-900 mb-2">Terms & Conditions</h1>
                            <p className="text-slate-600">Last updated: January 8, 2026</p>
                        </div>

                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8 prose prose-slate prose-compact max-w-none">
                                <h2>1. Acceptance of Terms</h2>
                                <p>By using Save2740 ("Service"), you accept these Terms. If you disagree, do not use our Service.</p>

                                <h2>2. Description of Service</h2>
                                <p>Save2740 is a savings challenge platform with automated contributions. Includes:</p>
                                <ul>
                                    <li>Automated savings challenges ($27.40 daily and variations)</li>
                                    <li>Secure wallet for storing savings</li>
                                    <li>Group contribution features</li>
                                    <li>Referral program</li>
                                    <li>Achievement tracking and streak monitoring</li>
                                </ul>

                                <h2>3. Eligibility</h2>
                                <p>Must be 18+ years old. By using the Service, you represent that you are 18+, have legal capacity to contract, and are not prohibited under applicable laws.</p>

                                <h2>4. Account Registration</h2>
                                <ul>
                                    <li>Maintain confidentiality of account credentials</li>
                                    <li>Provide accurate, current, and complete information</li>
                                    <li>Update information to keep it accurate</li>
                                    <li>Responsible for all activities under your account</li>
                                    <li>One account per person</li>
                                </ul>

                                <h2>5. Savings Challenges</h2>
                                <ul>
                                    <li>Enrolling commits you to regular contributions</li>
                                    <li>You authorize automatic withdrawals from connected payment method</li>
                                    <li>Failed payments may result in penalties or challenge termination</li>
                                    <li>You can pause or cancel challenges per our policies</li>
                                </ul>

                                <h2>6. Payment Terms</h2>
                                <p><strong>Auto-Debit:</strong> You authorize charges per your selected frequency (daily, weekly, monthly). Maintain sufficient funds. Failed payments retried once after 24 hours.</p>
                                <p><strong>Fees:</strong> First 3 withdrawals/month free. Additional: $1.50/transaction. Premium: $4.99/month (optional). All fees disclosed upfront.</p>

                                <h2>7. Wallet & Withdrawals</h2>
                                <ul>
                                    <li>Your savings are stored in a secure wallet</li>
                                    <li>Withdrawals typically process in 1-3 business days</li>
                                    <li>KYC verification required for withdrawals over $1,000</li>
                                    <li>We reserve the right to delay suspicious withdrawals for security review</li>
                                </ul>

                                <h2>8. Group Contributions</h2>
                                <ul>
                                    <li>Group challenges are binding commitments among 5-10 participants</li>
                                    <li>Payouts occur only after full rotation cycle completion</li>
                                    <li>Leaving a group before cycle completion may result in penalties</li>
                                    <li>Members are responsible for honoring their group commitments</li>
                                </ul>

                                <h2>9. Referral Program</h2>
                                <ul>
                                    <li>Referral bonuses are paid when referred users complete their first week</li>
                                    <li>Fraudulent referrals (fake accounts, self-referrals) are prohibited</li>
                                    <li>We reserve the right to void fraudulent referral bonuses</li>
                                    <li>Referral terms may change with notice</li>
                                </ul>

                                <h2>10. Prohibited Activities</h2>
                                <p>You agree not to:</p>
                                <ul>
                                    <li>Violate any laws or regulations</li>
                                    <li>Create multiple accounts or share your account</li>
                                    <li>Engage in fraudulent activity or money laundering</li>
                                    <li>Manipulate or exploit the Service</li>
                                    <li>Use bots or automated systems</li>
                                    <li>Harass other users or staff</li>
                                    <li>Reverse engineer or compromise the Service</li>
                                </ul>

                                <h2>11. Termination</h2>
                                <p>We may suspend or terminate accounts for Terms violations, fraudulent activity, bad-faith chargebacks, or 12+ months inactivity with zero balance. You may terminate by withdrawing all funds and contacting support.</p>

                                <h2>12. Disclaimer of Warranties</h2>
                                <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES. Save2740 does not guarantee uninterrupted access, error-free operation, or specific financial outcomes. Results depend on your commitment and circumstances.</p>

                                <h2>13. Limitation of Liability</h2>
                                <p>Save2740's liability is limited to amounts paid in the past 12 months. We are not liable for indirect, incidental, or consequential damages.</p>

                                <h2>14. Dispute Resolution</h2>
                                <p>Governing Law: California, USA. Disputes resolved through binding arbitration. Class action waiver: disputes resolved individually, not as part of a class action.</p>

                                <h2>15. Changes to Terms</h2>
                                <p>We may update these Terms with material changes notified via email or in-app. Continued use constitutes acceptance.</p>

                                <h2>16. Contact Us</h2>
                                <p>Email: legal@save2740.app<br />Address: Save2740 Inc., 123 Finance Street, San Francisco, CA 94105</p>
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

export default function TermsConditionsPage() {
    return (
        <ProtectedPage>
            <TermsContent />
        </ProtectedPage>
    )
}

