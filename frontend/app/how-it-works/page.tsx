"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { DollarSign, TrendingUp, Calendar, Users, Award, Wallet } from "lucide-react"

function HowItWorksContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="How It Works" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* Hero Section */}
                        <div className="text-center mb-12">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                                Save $10,000 in a Year with Save2740
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Join thousands saving consistently with our proven $27.40 daily challenge. Small amounts, massive results.
                            </p>
                        </div>

                        {/* The Challenge */}
                        <Card className="border-none shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-brand-green" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">The $27.40 Challenge</h2>
                                </div>
                                <p className="text-slate-700 text-lg mb-4">
                                    Save just <span className="font-bold text-brand-green">$27.40 every day</span> for 365 days, and you'll have <span className="font-bold">$10,000</span> at the end of the year.
                                </p>
                                <p className="text-slate-600">
                                    It's that simple. No complicated formulas, no increasing amounts. Just consistent daily savings that add up to life-changing amounts.
                                </p>
                            </CardContent>
                        </Card>

                        {/* How It Works Steps */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>

                            <Card className="border-none shadow-sm rounded-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">Sign Up & Choose Your Challenge</h3>
                                            <p className="text-slate-600">Create your account and select between daily, weekly, or monthly saving frequencies. Choose a multiplier (1x-10x) to match your goals.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm rounded-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">Set Up Auto-Debit</h3>
                                            <p className="text-slate-600">Connect your bank account or card. We'll automatically transfer your daily savings amount to your secure Save2740 wallet.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm rounded-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">Build Your Streak</h3>
                                            <p className="text-slate-600">Track your progress daily. Build streaks, earn badges, and watch your savings grow in real-time on your dashboard.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm rounded-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">Reach Your Goal</h3>
                                            <p className="text-slate-600">After 365 days of consistent saving, you'll have $10,000 (or more with multipliers) ready to withdraw or use for your goals!</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Key Features */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Powerful Features</h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                <Card className="border-none shadow-sm rounded-2xl">
                                    <CardContent className="p-6">
                                        <TrendingUp className="w-8 h-8 text-brand-green mb-3" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Multipliers (1x-10x)</h3>
                                        <p className="text-slate-600">Scale your challenge. Save 10x the base amount ($274/day) to reach $100,000 in a year!</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm rounded-2xl">
                                    <CardContent className="p-6">
                                        <Calendar className="w-8 h-8 text-brand-green mb-3" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Streak Tracking</h3>
                                        <p className="text-slate-600">Build momentum with streak counters. The longer your streak, the stronger your savings habit becomes.</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm rounded-2xl">
                                    <CardContent className="p-6">
                                        <Wallet className="w-8 h-8 text-brand-green mb-3" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Wallet</h3>
                                        <p className="text-slate-600">Your savings are safely stored in your wallet. Withdraw anytime or use for subscriptions and challenges.</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm rounded-2xl">
                                    <CardContent className="p-6">
                                        <Users className="w-8 h-8 text-brand-green mb-3" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Group Challenges</h3>
                                        <p className="text-slate-600">Join friends or family in group savings challenges. Save together, stay accountable, reach goals faster.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* CTA */}
                        <Card className="border-2 border-brand-green bg-brand-green/5 rounded-2xl">
                            <CardContent className="p-8 text-center">
                                <Award className="w-16 h-16 text-brand-green mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Start Saving?</h3>
                                <p className="text-slate-700 mb-6 max-w-xl mx-auto">
                                    Join thousands of successful savers who've transformed their finances with the $27.40 daily challenge.
                                </p>
                                <button className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                                    Start Your Challenge Today
                                </button>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </main>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-64 border-none">
                    <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default function HowItWorksPage() {
    return (
        <ProtectedPage>
            <HowItWorksContent />
        </ProtectedPage>
    )
}
