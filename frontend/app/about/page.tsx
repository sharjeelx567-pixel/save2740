"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { Target, Heart, Shield, Users } from "lucide-react"

function AboutContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="About Us" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">

                        <div className="text-center mb-12">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                                About Save2740
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                We're on a mission to make saving money simple, consistent, and achievable for everyone.
                            </p>
                        </div>

                        {/* Our Story */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
                                <div className="space-y-4 text-slate-700 leading-relaxed">
                                    <p>
                                        Save2740 was founded on a simple insight: <span className="font-semibold text-slate-900">small, consistent actions lead to extraordinary results</span>. Too many people struggle with saving because traditional methods feel overwhelming or unattainable.
                                    </p>
                                    <p>
                                        We asked ourselves: What if saving $10,000 wasn't about one massive effort, but 365 small, manageable steps? That's how the $27.40 daily challenge was born.
                                    </p>
                                    <p>
                                        Since launching, over <span className="font-semibold text-brand-green">50,000 people</span> have joined our community, collectively saving millions of dollars. We've helped people buy homes, start businesses, pay off debt, and achieve financial peace of mind.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mission & Vision */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border border-slate-200 shadow-sm rounded-2xl hover:border-brand-green/30 transition-colors">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                        <Target className="w-6 h-6 text-brand-green" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
                                    <p className="text-slate-700">
                                        To empower individuals and families worldwide to build financial security through simple, consistent saving habits.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200 shadow-sm rounded-2xl hover:border-brand-green/30 transition-colors">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                        <Heart className="w-6 h-6 text-brand-green" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
                                    <p className="text-slate-700">
                                        A world where everyone has the tools, knowledge, and motivation to achieve their financial goals—no matter where they start.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Core Values */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Core Values</h2>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold">1</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Simplicity</h4>
                                            <p className="text-slate-600">Saving money shouldn't be complicated. We design every feature to be intuitive and easy to use.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold">2</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Consistency</h4>
                                            <p className="text-slate-600">Small daily actions create lasting results. We celebrate progress, not perfection.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold">3</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Trust & Security</h4>
                                            <p className="text-slate-600">Your money and data are protected with bank-level security. We're fully regulated and transparent.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold">4</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Community</h4>
                                            <p className="text-slate-600">Saving is better together. We foster a supportive community that motivates and inspires.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Why Choose Us */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Choose Save2740?</h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-6 h-6 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Bank-Level Security</h4>
                                            <p className="text-slate-600 text-sm">256-bit encryption, SOC 2 certified, and fully insured deposits.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Users className="w-6 h-6 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">50,000+ Active Savers</h4>
                                            <p className="text-slate-600 text-sm">Join a thriving community achieving their financial goals.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Target className="w-6 h-6 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">Proven Results</h4>
                                            <p className="text-slate-600 text-sm">$200M+ saved by our users since 2023.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Heart className="w-6 h-6 text-brand-green flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1">User-First Design</h4>
                                            <p className="text-slate-600 text-sm">Built based on feedback from thousands of savers like you.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CTA */}
                        <Card className="border-2 border-brand-green bg-emerald-50 rounded-2xl">
                            <CardContent className="p-8 text-center">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Join Our Community</h3>
                                <p className="text-slate-700 mb-6 max-w-xl mx-auto">
                                    Be part of a growing movement of people taking control of their financial future.
                                </p>
                                <button className="bg-brand-green hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                                    Start Saving Today
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

export default function AboutPage() {
    return (
        <ProtectedPage>
            <AboutContent />
        </ProtectedPage>
    )
}
