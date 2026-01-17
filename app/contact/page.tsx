"use client"

import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { Mail, MessageSquare, Clock, MapPin, Send } from "lucide-react"

function ContactContent() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsSubmitting(false)
        setSubmitted(true)
        setFormData({ name: "", email: "", subject: "", message: "" })

        setTimeout(() => setSubmitted(false), 5000)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Contact Us" onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-8">

                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Get in Touch</h1>
                            <p className="text-lg text-slate-600">
                                Have questions? We're here to help! Reach out to our support team.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Contact Info */}
                            <Card className="border border-slate-200 shadow-sm rounded-2xl hover:border-brand-green/30 transition-colors">
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Email Support</h4>
                                                <a href="mailto:support@save2740.app" className="text-brand-green hover:underline">
                                                    support@save2740.app
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Live Chat</h4>
                                                <p className="text-slate-600 text-sm">Available Mon-Fri, 9 AM - 5 PM EST</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Clock className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Response Time</h4>
                                                <p className="text-slate-600 text-sm">Within 24 hours (usually much faster)</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-brand-green flex-shrink-0 mt-1" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-1">Address</h4>
                                                <p className="text-slate-600 text-sm">
                                                    Save2740 Inc.<br />
                                                    123 Finance Street<br />
                                                    San Francisco, CA 94105
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Links */}
                            <Card className="border border-slate-200 shadow-sm rounded-2xl hover:border-brand-green/30 transition-colors">
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Help</h2>

                                    <div className="space-y-3">
                                        <a
                                            href="/faq"
                                            className="block p-3 rounded-lg hover:bg-brand-green/5 transition-colors group"
                                        >
                                            <h4 className="font-semibold text-slate-900 group-hover:text-brand-green">FAQ / Help Center</h4>
                                            <p className="text-slate-600 text-sm">Find answers to common questions</p>
                                        </a>

                                        <a
                                            href="/how-it-works"
                                            className="block p-3 rounded-lg hover:bg-brand-green/5 transition-colors group"
                                        >
                                            <h4 className="font-semibold text-slate-900 group-hover:text-brand-green">How It Works</h4>
                                            <p className="text-slate-600 text-sm">Learn about the $27.40 challenge</p>
                                        </a>

                                        <a
                                            href="/help"
                                            className="block p-3 rounded-lg hover:bg-brand-green/5 transition-colors group"
                                        >
                                            <h4 className="font-semibold text-slate-900 group-hover:text-brand-green">Help Center</h4>
                                            <p className="text-slate-600 text-sm">Browse articles and guides</p>
                                        </a>

                                        <a
                                            href="/help/chat"
                                            className="block p-3 rounded-lg hover:bg-brand-green/5 transition-colors group"
                                        >
                                            <h4 className="font-semibold text-slate-900 group-hover:text-brand-green">Start Live Chat</h4>
                                            <p className="text-slate-600 text-sm">Chat with our support team</p>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl">
                            <CardContent className="p-6 md:p-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>

                                {submitted && (
                                    <div className="mb-6 p-4 bg-emerald-50 border border-brand-green rounded-lg">
                                        <p className="text-brand-green font-semibold">✓ Message sent successfully! We'll get back to you soon.</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-900 mb-2">
                                                Your Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-900 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                                            Subject
                                        </label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                                        >
                                            <option value="">Select a topic</option>
                                            <option value="account">Account & Login Issues</option>
                                            <option value="payment">Payment & Wallet Questions</option>
                                            <option value="challenge">Challenge & Streaks</option>
                                            <option value="withdrawal">Withdrawal Request</option>
                                            <option value="technical">Technical Support</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                                            placeholder="Please describe your question or issue in detail..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-brand-green hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            "Sending..."
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
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

export default function ContactPage() {
    return (
        <ProtectedPage>
            <ContactContent />
        </ProtectedPage>
    )
}
