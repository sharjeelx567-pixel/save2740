"use client";

import { ProtectedPage } from "@/components/protected-page";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MessageCircle, BookOpen, FileText, Mail, Phone, HelpCircle } from "lucide-react";
import Link from "next/link";

const popularTopics = [
    { icon: BookOpen, title: "Getting Started", link: "/help/getting-started", color: "bg-blue-50 text-blue-600" },
    { icon: MessageCircle, title: "Account & Security", link: "/help/account", color: "bg-green-50 text-green-600" },
    { icon: FileText, title: "Payments & Wallet", link: "/help/payments", color: "bg-purple-50 text-purple-600" },
    { icon: HelpCircle, title: "Save2740 Challenge", link: "/help/challenge", color: "bg-orange-50 text-orange-600" },
];

const faqs = [
    {
        question: "How does the $27.40 daily savings challenge work?",
        answer: "Save $27.40 every day for a year to reach $10,000+ in annual savings. You can choose daily or weekly contributions.",
    },
    {
        question: "How do I withdraw my savings?",
        answer: "Go to My Wallet → Withdraw Money, enter the amount, and select your linked bank account. Funds arrive in 1-3 business days.",
    },
    {
        question: "What are the fees?",
        answer: "No monthly fees! We charge a 2.9% fee on wallet top-ups and withdrawals to cover payment processing costs.",
    },
    {
        question: "Is my money safe?",
        answer: "Yes! We use bank-level security, encryption, and your funds are held in FDIC-insured partner banks.",
    },
];

function HelpCenterContent() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-full">
                <Sidebar />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Help Center" onMenuClick={() => setIsSidebarOpen(true)} />

                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Hero Section */}
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">How can we help you?</h1>
                            <p className="text-lg text-gray-600">Search for answers or browse our help topics</p>

                            {/* Search Bar */}
                            <div className="max-w-2xl mx-auto">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search for help..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green text-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Popular Topics */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Topics</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {popularTopics.map((topic, idx) => (
                                    <Link key={idx} href={topic.link}>
                                        <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow cursor-pointer h-full">
                                            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                                                <div className={`p-4 rounded-full ${topic.color}`}>
                                                    <topic.icon className="w-8 h-8" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* FAQs */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {faqs.map((faq, idx) => (
                                    <Card key={idx} className="border-0 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{faq.question}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-600">{faq.answer}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Contact Options */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Still need help?</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Link href="/help/contact">
                                    <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                                        <CardContent className="p-6 flex items-center gap-4">
                                            <div className="p-3 bg-emerald-50 rounded-lg">
                                                <Mail className="w-6 h-6 text-brand-green" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Contact Support</h3>
                                                <p className="text-sm text-gray-600">We'll respond within 24 hours</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>

                                <Link href="/help/chat">
                                    <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                                        <CardContent className="p-6 flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <MessageCircle className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Live Chat</h3>
                                                <p className="text-sm text-gray-600">Mon-Fri, 9am-6pm EST</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>

                                <a href="tel:+18005552740">
                                    <Card className="border-0 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                                        <CardContent className="p-6 flex items-center gap-4">
                                            <div className="p-3 bg-purple-50 rounded-lg">
                                                <Phone className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Call Us</h3>
                                                <p className="text-sm text-gray-600">1-800-555-2740</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function HelpCenterPage() {
    return (
        <ProtectedPage>
            <HelpCenterContent />
        </ProtectedPage>
    );
}

