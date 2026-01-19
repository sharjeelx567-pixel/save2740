"use client";

import { ProtectedPage } from "@/components/protected-page";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ContactSupportContent() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        category: "general",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (submitted) {
        return (
            <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
                <div className="hidden lg:block h-full">
                    <Sidebar />
                </div>

                <main className="flex-1 overflow-y-auto flex flex-col">
                    <DashboardHeader title="Contact Support" onMenuClick={() => setIsSidebarOpen(true)} />

                    <div className="flex-1 flex items-center justify-center p-4">
                        <Card className="max-w-md w-full border-0 shadow-xl">
                            <CardContent className="p-8 text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="bg-green-100 rounded-full p-4">
                                        <CheckCircle className="w-12 h-12 text-green-600" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Message Sent!</h2>
                                <p className="text-gray-600">
                                    We've received your message and will respond within 24 hours to <strong>{formData.email}</strong>
                                </p>
                                <Button onClick={() => setSubmitted(false)} className="w-full bg-brand-green hover:bg-brand-green/90">
                                    Send Another Message
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <div className="hidden lg:block h-full">
                <Sidebar />
            </div>

            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="flex-1 overflow-y-auto flex flex-col">
                <DashboardHeader title="Contact Support" onMenuClick={() => setIsSidebarOpen(true)} />

                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h1>
                            <p className="text-gray-600">Fill out the form below and our support team will get back to you within 24 hours.</p>
                        </div>

                        <Alert className="bg-blue-50 border-blue-200">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <AlertDescription className="text-blue-900 ml-2">
                                <strong>Response Time:</strong> We typically respond within 24 hours during business days.
                            </AlertDescription>
                        </Alert>

                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-2xl">Submit a Support Ticket</CardTitle>
                                <CardDescription>Please provide as much detail as possible</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="john@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                            required
                                        >
                                            <option value="general">General Inquiry</option>
                                            <option value="account">Account & Security</option>
                                            <option value="payments">Payments & Wallet</option>
                                            <option value="savings">Save2740 Challenge</option>
                                            <option value="technical">Technical Issue</option>
                                            <option value="feedback">Feedback</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="Brief description of your issue"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Please provide detailed information about your question or issue..."
                                            className="min-h-32"
                                            required
                                        />
                                    </div>

                                    <Button type="submit" disabled={loading} className="w-full bg-brand-green hover:bg-brand-green/90 gap-2">
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Other Ways to Reach Us:</h3>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <p>📧 Email: support@save2740.com</p>
                                    <p>📞 Phone: 1-800-555-2740 (Mon-Fri, 9am-6pm EST)</p>
                                    <p>💬 Live Chat: Available on our Help Center</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ContactSupportPage() {
    return (
        <ProtectedPage>
            <ContactSupportContent />
        </ProtectedPage>
    );
}
