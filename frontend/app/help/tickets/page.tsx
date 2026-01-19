"use client";

import { ProtectedPage } from "@/components/protected-page";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, MessageSquare, Eye } from "lucide-react";

interface Ticket {
    id: string;
    subject: string;
    category: string;
    status: "open" | "in-progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high";
    createdAt: string;
    lastUpdated: string;
    messages: number;
}

function TicketStatusContent() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchTickets = async () => {
        try {
          const response = await fetch('/api/support/tickets', {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setTickets(data.data.tickets || []);
          }
        } catch (error) {
          console.error('Error fetching tickets:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTickets();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "in-progress":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "resolved":
                return "bg-green-100 text-green-700 border-green-200";
            case "closed":
                return "bg-gray-100 text-gray-700 border-gray-200";
            default:
                return "";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-100 text-red-700";
            case "medium":
                return "bg-orange-100 text-orange-700";
            case "low":
                return "bg-gray-100 text-gray-700";
            default:
                return "";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "open":
                return <Clock className="w-4 h-4" />;
            case "in-progress":
                return <AlertCircle className="w-4 h-4" />;
            case "resolved":
            case "closed":
                return <CheckCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

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
                <DashboardHeader title="My Tickets" onMenuClick={() => setIsSidebarOpen(true)} />

                <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
                                <p className="text-gray-600">Track all your support requests in one place</p>
                            </div>
                            <Button className="bg-brand-green hover:bg-brand-green/90" onClick={() => window.location.href = "/help/contact"}>
                                New Ticket
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid sm:grid-cols-4 gap-4">
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600 mb-1">Total</p>
                                    <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600 mb-1">Open</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {tickets.filter((t) => t.status === "open").length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600 mb-1">In Progress</p>
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {tickets.filter((t) => t.status === "in-progress").length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600 mb-1">Resolved</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {tickets.filter((t) => t.status === "resolved" || t.status === "closed").length}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tickets List */}
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <Card key={ticket.id} className="border-0 shadow-sm hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-mono text-gray-500">{ticket.id}</span>
                                                    <Badge className={`${getStatusColor(ticket.status)} border`}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(ticket.status)}
                                                            {ticket.status.replace("-", " ").toUpperCase()}
                                                        </span>
                                                    </Badge>
                                                    <Badge className={getPriorityColor(ticket.priority)}>
                                                        {ticket.priority.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">{ticket.category}</p>
                                            </div>
                                            <Button variant="outline" className="gap-2">
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Created</p>
                                                <p className="font-medium text-gray-900">{ticket.createdAt}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Last Updated</p>
                                                <p className="font-medium text-gray-900">{ticket.lastUpdated}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Messages</p>
                                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                                    <MessageSquare className="w-4 h-4" />
                                                    {ticket.messages}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function TicketsPage() {
    return (
        <ProtectedPage>
            <TicketStatusContent />
        </ProtectedPage>
    );
}
