'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  X,
  Lock,
  MessageCircle,
  FileCheck,
  CreditCard,
  AlertCircle,
  Loader2,
  Reply,
  CheckCheck,
} from 'lucide-react'
import { notificationsService, Notification } from '@/lib/services/notifications.service'

const POLL_INTERVAL_MS = 25000
const NOTIFICATION_SOUND_DURATION_MS = 200

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.15, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + NOTIFICATION_SOUND_DURATION_MS / 1000)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + NOTIFICATION_SOUND_DURATION_MS / 1000)
  } catch {
    // ignore
  }
}

function getIcon(type: string) {
  switch (type) {
    case 'chat_message':
    case 'support_reply':
      return <MessageCircle className="h-5 w-5 text-blue-600" />
    case 'kyc_status':
      return <FileCheck className="h-5 w-5 text-amber-600" />
    case 'payment_success':
      return <CreditCard className="h-5 w-5 text-green-600" />
    case 'login_attempt':
    case 'password_changed':
    case 'security_alert':
      return <Lock className="h-5 w-5 text-red-600" />
    case 'warning':
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-amber-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

function formatDate(createdAt: string) {
  const d = new Date(createdAt)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString()
}

export default function AdminNotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unseenChatCount, setUnseenChatCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const previousUnreadRef = useRef<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchFeed = useCallback(async () => {
    try {
      const res = await notificationsService.getFeed({ page: 1, limit: 30 })
      if (res.success && res.data) {
        const list = (res.data.notifications || []).map((n: any) => ({
          ...n,
          id: n._id || n.id,
        }))
        setNotifications(list)
        setUnreadCount(res.data.unreadCount ?? 0)
        setUnseenChatCount(res.data.unseenChatCount ?? 0)

        // Play sound if unread count increased (new notification)
        if (previousUnreadRef.current !== null && res.data.unreadCount > previousUnreadRef.current) {
          playNotificationSound()
        }
        previousUnreadRef.current = res.data.unreadCount
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchFeed])

  const handleMarkRead = async (id: string) => {
    setMarkingId(id)
    try {
      await notificationsService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || (n as any)._id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      const n = notifications.find((x) => x.id === id || (x as any)._id === id)
      if (n?.type === 'chat_message') setUnseenChatCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      setUnseenChatCount(0)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {unseenChatCount > 0 && unreadCount !== unseenChatCount && (
          <span
            className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white"
            title={`${unseenChatCount} unread chat message(s)`}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-h-[85vh] flex flex-col bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <h2 className="text-base font-bold text-gray-900">Notifications</h2>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-brand-green font-medium hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 max-h-[calc(85vh-56px)]">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4 text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => {
                  const id = n.id || (n as any)._id
                  const isChat = n.type === 'chat_message' || n.type === 'support_reply'
                  const chatUserId = n.relatedData?.chatUserId

                  return (
                    <li
                      key={id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                        !n.read ? 'bg-green-50/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {!n.read && (
                          <span
                            className="shrink-0 mt-2 w-2 h-2 rounded-full bg-green-500"
                            title="Unread"
                          />
                        )}
                        <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-gray-100">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                            <span className="text-xs text-gray-500 shrink-0">
                              {formatDate(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                          {isChat && (
                            <div className="mt-2 flex items-center gap-2">
                              {n.type === 'chat_message' && !n.read && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Unseen chat
                                </span>
                              )}
                              {chatUserId && (
                                <Link
                                  href={`/support/live-chat?userId=${chatUserId}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-green hover:underline"
                                  onClick={() => setOpen(false)}
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                  Reply
                                </Link>
                              )}
                            </div>
                          )}
                          {n.type === 'kyc_status' && n.relatedData?.submittedByUserId && (
                            <Link
                              href={`/kyc/${n.relatedData.submittedByUserId}`}
                              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-green hover:underline"
                              onClick={() => {
                                setOpen(false)
                                if (!n.read) handleMarkRead(id)
                              }}
                            >
                              Review KYC
                            </Link>
                          )}
                          {n.type === 'payment_success' && n.relatedData?.transactionId && (
                            <Link
                              href={`/payments/${n.relatedData.transactionId}`}
                              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-green hover:underline"
                              onClick={() => {
                                setOpen(false)
                                if (!n.read) handleMarkRead(id)
                              }}
                            >
                              View payment
                            </Link>
                          )}
                        </div>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(id)}
                            disabled={markingId === id}
                            className="shrink-0 text-xs text-gray-500 hover:text-brand-green disabled:opacity-50"
                            title="Mark as read"
                          >
                            {markingId === id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Mark read'
                            )}
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
