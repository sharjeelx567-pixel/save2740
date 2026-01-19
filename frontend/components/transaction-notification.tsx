"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, X } from "lucide-react"

export interface TransactionNotification {
  id: string
  type: "success" | "failure"
  title: string
  message: string
  amount?: number
  transactionId?: string
  timestamp?: Date
  action?: {
    label: string
    onClick: () => void
  }
}

interface TransactionNotificationProps {
  notification: TransactionNotification
  onClose: (id: string) => void
}

/**
 * TransactionNotification Component
 * Shows success or failure notification for wallet transactions
 */
export function TransactionNotification({
  notification,
  onClose,
}: TransactionNotificationProps) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true)
      setTimeout(() => {
        onClose(notification.id)
      }, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [notification.id, onClose])

  const isSuccess = notification.type === "success"

  return (
    <div
      className={`transform transition-all duration-300 ${
        isClosing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      <div
        className={`rounded-2xl shadow-lg border-2 overflow-hidden ${
          isSuccess
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        {/* Header with gradient */}
        <div
          className={`px-6 py-4 flex items-center justify-between gap-4 ${
            isSuccess
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-red-500 to-orange-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0 animate-bounce" />
            ) : (
              <XCircle className="w-6 h-6 text-white flex-shrink-0" />
            )}
            <h3 className="text-white font-bold">{notification.title}</h3>
          </div>
          <button
            onClick={() => {
              setIsClosing(true)
              setTimeout(() => {
                onClose(notification.id)
              }, 300)
            }}
            className="text-white hover:bg-white/20 p-1 sm:p-1.5 rounded transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700">{notification.message}</p>

          {notification.amount && (
            <div
              className={`bg-white rounded-lg p-4 border-2 ${
                isSuccess ? "border-emerald-200" : "border-red-200"
              }`}
            >
              <p className="text-xs text-slate-600 mb-1">Transaction Amount</p>
              <p
                className={`text-3xl font-bold ${
                  isSuccess ? "text-emerald-600" : "text-red-600"
                }`}
              >
                ${notification.amount.toFixed(2)}
              </p>
            </div>
          )}

          {notification.transactionId && (
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Transaction ID</p>
              <p className="text-sm font-mono text-slate-800 break-all">
                {notification.transactionId}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                  isSuccess
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {notification.action.label}
              </button>
            )}
            <button
              onClick={() => {
                setIsClosing(true)
                setTimeout(() => {
                  onClose(notification.id)
                }, 300)
              }}
              className="px-4 py-3 rounded-lg font-semibold border-2 transition-colors"
              style={{
                borderColor: isSuccess ? "#d1fae5" : "#fee2e2",
                color: isSuccess ? "#059669" : "#dc2626",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * TransactionNotificationContainer Component
 * Manages multiple transaction notifications
 */
export function TransactionNotificationContainer() {
  const [notifications, setNotifications] = useState<
    TransactionNotification[]
  >([])

  // This would be connected to a global notification service in production
  // For now, we expose a way to add notifications
  useEffect(() => {
    // Listen for custom events
    const handleNotification = (
      event: CustomEvent<TransactionNotification>
    ) => {
      setNotifications((prev) => [...prev, event.detail])
    }

    window.addEventListener(
      "transaction-notification" as any,
      handleNotification
    )
    return () =>
      window.removeEventListener(
        "transaction-notification" as any,
        handleNotification
      )
  }, [])

  const handleClose = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <TransactionNotification
          key={notification.id}
          notification={notification}
          onClose={handleClose}
        />
      ))}
    </div>
  )
}

/**
 * Utility function to show transaction notification
 */
export function showTransactionNotification(
  notification: Omit<TransactionNotification, "id">
) {
  const event = new CustomEvent("transaction-notification", {
    detail: {
      ...notification,
      id: `notif-${Date.now()}`,
    },
  })
  window.dispatchEvent(event)
}
