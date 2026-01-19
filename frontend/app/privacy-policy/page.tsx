"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

function PrivacyPolicyContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Privacy Policy" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-6">

                        <div className="mb-8">
                            <h1 className="hidden lg:block text-2xl md:text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
                            <p className="text-slate-600">Last updated: January 8, 2026</p>
                        </div>

                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8 prose prose-slate prose-compact max-w-none">
                                <h2>1. Information We Collect</h2>

                                <h3>Personal Information</h3>
                                <ul>
                                    <li>Name, email address, and contact information</li>
                                    <li>Date of birth (for age verification)</li>
                                    <li>Government-issued ID (for KYC verification)</li>
                                    <li>Bank account and payment method details</li>
                                    <li>Residential address</li>
                                </ul>

                                <h3>Financial Information</h3>
                                <ul>
                                    <li>Transaction history and wallet balance</li>
                                    <li>Savings challenge progress and streak data</li>
                                    <li>Payment method details (securely tokenized)</li>
                                    <li>Withdrawal requests and history</li>
                                </ul>

                                <h3>Usage Information</h3>
                                <ul>
                                    <li>Device information (type, OS, browser)</li>
                                    <li>IP address and location data</li>
                                    <li>App usage patterns and feature engagement</li>
                                    <li>Communication preferences</li>
                                </ul>

                                <h2>2. How We Use Your Information</h2>
                                <ul>
                                    <li>Process contributions, manage challenges, handle withdrawals</li>
                                    <li>Verify identity (KYC/AML compliance)</li>
                                    <li>Send notifications, updates, and support responses</li>
                                    <li>Analyze usage patterns and optimize features</li>
                                    <li>Detect and prevent fraudulent activity</li>
                                    <li>Send promotional offers (with your consent)</li>
                                </ul>

                                <h2>3. Information Sharing</h2>
                                <p><strong>We never sell your personal information.</strong> We share data only with:</p>
                                <ul>
                                    <li><strong>Service Providers:</strong> Payment processors (Stripe, Plaid), cloud hosting (AWS, Vercel), analytics (anonymized), customer support tools</li>
                                    <li><strong>Legal Requirements:</strong> Law enforcement, regulatory authorities, court orders when legally required</li>
                                </ul>

                                <h2>4. Data Security</h2>
                                <ul>
                                    <li>256-bit SSL/TLS encryption for data in transit</li>
                                    <li>Encrypted databases with access controls</li>
                                    <li>PCI-DSS compliant payment processing</li>
                                    <li>SOC 2 certified security controls</li>
                                    <li>Optional two-factor authentication (2FA)</li>
                                    <li>Quarterly security audits</li>
                                </ul>

                                <h2>5. Your Privacy Rights</h2>
                                <p>You have the right to access, correct, delete, export (CSV), opt-out of marketing, and object to data processing. Contact: privacy@save2740.app</p>

                                <h2>6. Cookies and Tracking</h2>
                                <p>We use cookies for essential functions (login, security), analytics (anonymized), and preferences. Manage settings in your browser.</p>

                                <h2>7. Data Retention</h2>
                                <ul>
                                    <li>Active accounts: Retained while account is active</li>
                                    <li>Closed accounts: 7 years (legal/tax compliance)</li>
                                    <li>Transaction records: 10 years (financial regulations)</li>
                                    <li>Marketing data: Deleted upon unsubscribe</li>
                                </ul>

                                <h2>8. Children's Privacy</h2>
                                <p>Save2740 is not intended for users under 18. We do not knowingly collect information from minors and will delete any discovered minor accounts immediately.</p>

                                <h2>9. International Users</h2>
                                <p>Save2740 is US-based. By using our Service, you consent to data transfer to the US. We comply with GDPR for EU users and applicable data protection laws.</p>

                                <h2>10. Third-Party Links</h2>
                                <p>Our Service may contain third-party links. We are not responsible for their privacy practices. Review their policies separately.</p>

                                <h2>11. Changes to Privacy Policy</h2>
                                <p>We may update this policy with material changes notified via email or in-app. Continued use constitutes acceptance.</p>

                                <h2>12. Contact Us</h2>
                                <p>Email: privacy@save2740.app | DPO: dpo@save2740.app<br />Address: Save2740 Inc., 123 Finance Street, San Francisco, CA 94105</p>

                                <h2>13. State-Specific Rights</h2>
                                <p><strong>California (CCPA):</strong> Right to know, delete, opt-out (we don't sell data), non-discrimination.</p>
                                <p><strong>EU (GDPR):</strong> Legal basis: contract performance and legitimate interest. Right to lodge complaints with supervisory authority and withdraw consent.</p>
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

export default function PrivacyPolicyPage() {
    return (
        <ProtectedPage>
            <PrivacyPolicyContent />
        </ProtectedPage>
    )
}
