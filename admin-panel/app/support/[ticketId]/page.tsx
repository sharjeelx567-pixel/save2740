'use client'

import { useState, useEffect, useRef } from 'react' // Added useRef
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Send, User as UserIcon, Shield, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function TicketDetailPage() {
    const params = useParams()
    const router = useRouter()
    const ticketId = params.ticketId as string
    const scrollRef = useRef<HTMLDivElement>(null) // Ref for scrolling

    const [ticket, setTicket] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [replyMessage, setReplyMessage] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        fetchTicket()
    }, [ticketId])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [ticket?.messages])

    const fetchTicket = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`http://localhost:5000/api/admin/support-tickets/${ticketId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setTicket({
                    ...data.data.ticket,
                    user: data.data.user,
                    assignedAdmin: data.data.assignedAdmin
                })
            } else {
                // Handle error
            }
        } catch (error) {
            console.error('Error fetching ticket:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async () => {
        if (!replyMessage.trim()) return

        setSending(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`http://localhost:5000/api/admin/support-tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: replyMessage })
            })
            const data = await res.json()
            if (data.success) {
                setReplyMessage('')
                fetchTicket() // Refresh messages
            }
        } catch (error) {
            console.error('Error sending reply:', error)
        } finally {
            setSending(false)
        }
    }

    const updateStatus = async (newStatus: string) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`http://localhost:5000/api/admin/support-tickets/${ticketId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            })
            const data = await res.json()
            if (data.success) {
                fetchTicket()
            }
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>
    if (!ticket) return <AdminLayout><div>Ticket not found</div></AdminLayout>

    return (
        <AdminLayout>
            <PageHeader
                title={`Ticket #${ticket.ticketNumber}`}
                description="View and reply to support ticket"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Support', href: '/support' },
                    { label: ticket.ticketNumber }
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Chat Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                                <Badge variant={ticket.status === 'open' ? 'danger' : ticket.status === 'resolved' ? 'success' : 'warning'}>
                                    {ticket.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500">Category: {ticket.category}</p>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-0">
                            {/* Messages Area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {ticket.messages.map((msg: any, index: number) => {
                                    const isAdmin = msg.senderType === 'admin'
                                    return (
                                        <div key={index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex max-w-[80%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
                                                    {isAdmin ? <Shield size={16} /> : <UserIcon size={16} />}
                                                </div>
                                                <div>
                                                    <div className={`p-3 rounded-lg ${isAdmin ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none shadow-sm'}`}>
                                                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                    </div>
                                                    <p className={`text-xs mt-1 ${isAdmin ? 'text-right' : 'text-left'} text-gray-400`}>
                                                        {formatDateTime(msg.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Reply Area */}
                            <div className="p-4 border-t bg-white">
                                <div className="flex gap-2">
                                    <textarea
                                        className="flex-1 min-h-[80px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="Type your reply..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                    />
                                    <Button
                                        className="self-end"
                                        variant="primary"
                                        onClick={handleReply}
                                        disabled={sending || !replyMessage.trim()}
                                    >
                                        <Send size={18} className="mr-2" />
                                        Reply
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-md">Ticket Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Status</label>
                                <div className="mt-1 flex gap-2">
                                    {ticket.status !== 'resolved' && (
                                        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus('resolved')}>
                                            <CheckCircle size={16} className="mr-2" />
                                            Mark Resolved
                                        </Button>
                                    )}
                                    {ticket.status === 'resolved' && (
                                        <Button size="sm" variant="outline" className="w-full" onClick={() => updateStatus('in-progress')}>
                                            <Clock size={16} className="mr-2" />
                                            Re-open
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Priority</label>
                                <div className="mt-1">
                                    <Badge variant={ticket.priority === 'urgent' ? 'danger' : 'warning'}>{ticket.priority}</Badge>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <label className="text-xs text-gray-500 uppercase font-semibold">User Info</label>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <UserIcon size={20} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{ticket.user?.firstName} {ticket.user?.lastName}</p>
                                        <p className="text-xs text-gray-500">{ticket.user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    )
}
