"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { Shield, Users, Heart, AlertTriangle, CheckCircle } from "lucide-react"

function CommunityGuidelinesContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Community Guidelines" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">

                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Community Guidelines</h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Save2740 is built on trust, respect, and mutual support. These guidelines help us maintain a positive community.
                            </p>
                        </div>

                        {/* Core Principles */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Heart className="w-8 h-8 text-brand-green" />
                                    <h2 className="text-2xl font-bold text-slate-900">Our Core Principles</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Be Respectful</h4>
                                            <p className="text-slate-600 text-sm">Treat all members with kindness and respect, regardless of their savings goals or progress.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Be Supportive</h4>
                                            <p className="text-slate-600 text-sm">Encourage others, celebrate their wins, and offer help when someone is struggling.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Be Honest</h4>
                                            <p className="text-slate-600 text-sm">Practice transparency in group challenges and referral activities.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Be Accountable</h4>
                                            <p className="text-slate-600 text-sm">Honor your commitments in group savings and follow through on your challenges.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Group Contribution Guidelines */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Users className="w-8 h-8 text-brand-green" />
                                    <h2 className="text-2xl font-bold text-slate-900">Group Contribution Rules</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">1. Commitment & Reliability</h4>
                                        <ul className="space-y-2 text-slate-700 ml-4">
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Make contributions on time according to the group schedule</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Communicate early if you anticipate any payment difficulties</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Don't join groups if you can't commit to the full cycle</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">2. Fair Participation</h4>
                                        <ul className="space-y-2 text-slate-700 ml-4">
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Groups are limited to 5-10 members for manageability</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Payout happens only after the full rotation cycle completes</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>No early withdrawals or cycle interruptions allowed</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">3. Transparency</h4>
                                        <ul className="space-y-2 text-slate-700 ml-4">
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Be clear about your financial capacity before joining</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Understand and agree to the group's contribution schedule</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-brand-green mt-1">•</span>
                                                <span>Report any issues or concerns to the group admin immediately</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Referral Program Guidelines */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Shield className="w-8 h-8 text-brand-green" />
                                    <h2 className="text-2xl font-bold text-slate-900">Referral Program Etiquette</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">✓ Dos</h4>
                                        <ul className="space-y-2 text-slate-700 ml-4">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-brand-green mt-1 flex-shrink-0" />
                                                <span>Share your genuine experience with Save2740</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-brand-green mt-1 flex-shrink-0" />
                                                <span>Explain how the app works honestly and accurately</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-brand-green mt-1 flex-shrink-0" />
                                                <span>Support your referrals if they have questions</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-brand-green mt-1 flex-shrink-0" />
                                                <span>Use your unique referral link provided in the app</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">✗ Don'ts</h4>
                                        <ul className="space-y-2 text-slate-700 ml-4">
                                            <li className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                                                <span>Make unrealistic promises or guarantee specific returns</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                                                <span>Use spam, bots, or automated tools to share links</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                                                <span>Create fake accounts or abuse the system</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                                                <span>Misrepresent Save2740 as a get-rich-quick scheme</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Prohibited Conduct */}
                        <Card className="border-2 border-red-200 bg-red-50 rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                    <h2 className="text-2xl font-bold text-slate-900">Prohibited Conduct</h2>
                                </div>

                                <p className="text-slate-700 mb-4">The following behaviors will result in account suspension or termination:</p>

                                <ul className="space-y-2 text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-1">✗</span>
                                        <span><strong>Fraud</strong> - Creating fake accounts, manipulating systems, or dishonest financial activity</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-1">✗</span>
                                        <span><strong>Harassment</strong> - Bullying, threatening, or harassing other members</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-1">✗</span>
                                        <span><strong>Spam</strong> - Excessive messaging, unsolicited promotions, or commercial activity</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-1">✗</span>
                                        <span><strong>Account Sharing</strong> - Sharing login credentials or allowing others to use your account</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-1">✗</span>
                                        <span><strong>Violating Laws</strong> - Money laundering, tax evasion, or any illegal activities</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Enforcement */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">Guideline Enforcement</h2>

                                <div className="space-y-4 text-slate-700">
                                    <p>
                                        We take these guidelines seriously. Violations may result in:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start gap-2">
                                            <span className="text-brand-green mt-1">•</span>
                                            <span><strong>Warning</strong> - First-time minor violations receive a warning</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-brand-green mt-1">•</span>
                                            <span><strong>Feature Restrictions</strong> - Temporary loss of group/referral access</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-brand-green mt-1">•</span>
                                            <span><strong>Account Suspension</strong> - Serious or repeated violations</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-brand-green mt-1">•</span>
                                            <span><strong>Permanent Ban</strong> - Fraudulent activity or severe misconduct</span>
                                        </li>
                                    </ul>
                                    <p className="text-sm">
                                        If you witness guideline violations, please report them to <a href="mailto:support@save2740.app" className="text-brand-green hover:underline">support@save2740.app</a>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Updates */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-slate-50">
                            <CardContent className="p-6">
                                <p className="text-slate-600 text-sm">
                                    <strong>Last updated:</strong> January 8, 2026<br />
                                    We may update these guidelines from time to time. Continued use of Save2740 means you accept any changes.
                                </p>
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

export default function CommunityGuidelinesPage() {
    return (
        <ProtectedPage>
            <CommunityGuidelinesContent />
        </ProtectedPage>
    )
}

