'use client'


import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Send, Bell, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { notificationsService, Notification } from '@/lib/services/notifications.service'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner' // Assuming sonner

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<Notification[]>([])

  // Send Form State
  const [targetAudience, setTargetAudience] = useState('all_users')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState('')

  const fetchHistory = async () => {
    try {
      const response = await notificationsService.getHistory()
      if (response.success && response.data) {
        setHistory(response.data.notifications)
      }
    } catch (err) {
      console.error("Failed to fetch notification history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleSend = async () => {
    if (!title || !message) {
      toast.error("Please fill in title and message")
      return
    }

    setSending(true)
    try {
      const response = await notificationsService.send({
        targetAudience,
        title,
        message,
        userId: targetAudience === 'specific_user' ? userId : undefined,
        type: 'info'
      })

      if (response.success) {
        toast.success(`Notification sent to ${response.count} users`)
        setTitle('')
        setMessage('')
        setUserId('')
        fetchHistory()
      } else {
        toast.error(response.message || "Failed to send")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Notifications"
        description="Send notifications to users"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Notifications' }
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Notification */}
          <Card>
            <CardHeader>
              <CardTitle>Send Push Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Audience</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                >
                  <option value="all_users">All Users</option>
                  <option value="active_users">Active Users Only</option>
                  <option value="pending_kyc">Users with Pending KYC</option>
                  <option value="specific_user">Specific User (ID)</option>
                </select>
              </div>

              {targetAudience === 'specific_user' && (
                <Input
                  label="User ID"
                  placeholder="Enter User ID..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              )}

              <Input
                label="Title"
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  placeholder="Notification message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                className="w-full flex justify-center items-center gap-2"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending...' : 'Send Notification'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent History</CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchHistory}>
                  <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {loading && history.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No notifications sent yet
                  </div>
                ) : (
                  history.map((notif) => (
                    <div key={notif.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-brand-green/10 rounded-lg">
                          <Bell className="h-4 w-4 text-brand-green" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {formatDateTime(notif.createdAt)}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 capitalize">
                              {notif.type}
                            </span>
                            {notif.recipientName && (
                              <span className="text-xs text-gray-500">• To: {notif.recipientName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout >
  )
}
