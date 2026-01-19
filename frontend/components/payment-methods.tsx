"use client"

import { useState } from "react"
import { CreditCard, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface PaymentMethod {
  id: string
  type: "card" | "bank"
  name: string
  last4: string
  brand?: string
  expiryDate?: string
  bankName?: string
  accountType?: string
  isDefault: boolean
  addedDate: string
}

/**
 * PaymentMethods Component
 * Displays and manages user's payment methods
 */
export function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      name: "Visa",
      last4: "4242",
      brand: "Visa",
      expiryDate: "12/25",
      isDefault: true,
      addedDate: "2025-12-01",
    },
    {
      id: "2",
      type: "bank",
      name: "Chase Checking",
      last4: "6789",
      bankName: "Chase Bank",
      accountType: "Checking",
      isDefault: false,
      addedDate: "2025-11-15",
    },
  ])
  const [loading, setLoading] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAddBank, setShowAddBank] = useState(false)

  const handleRemove = (id: string) => {
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSetDefault = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Payment Methods</h3>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`border-2 rounded-2xl overflow-hidden transition-all ${
              method.isDefault
                ? "border-brand-green bg-emerald-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <CardContent className="p-5 md:p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`p-3 rounded-lg ${
                    method.type === "card"
                      ? "bg-green-100"
                      : "bg-purple-100"
                  }`}
                >
                  <CreditCard
                    className={`w-5 h-5 ${
                      method.type === "card"
                        ? "text-brand-green"
                        : "text-purple-600"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">
                      {method.name}
                    </p>
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {method.type === "card"
                      ? `•••• ${method.last4} (Expires ${method.expiryDate})`
                      : `${method.bankName} - ${method.accountType} •••• ${method.last4}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Added {new Date(method.addedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleRemove(method.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Payment Method Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowAddCard(true)}
          className="p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-slate-400 hover:bg-slate-50 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 group-hover:bg-green-200 rounded-lg transition-colors">
              <CreditCard className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Add Debit Card</p>
              <p className="text-xs text-slate-600">Visa, Mastercard, Amex</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowAddBank(true)}
          className="p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-slate-400 hover:bg-slate-50 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 group-hover:bg-purple-200 rounded-lg transition-colors">
              <Plus className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Add Bank Account</p>
              <p className="text-xs text-slate-600">Link via Plaid</p>
            </div>
          </div>
        </button>
      </div>

      {/* Modals for adding payment methods would go here */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Add Debit Card</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddCard(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCard(false)
                    }}
                    className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-emerald-600"
                  >
                    Add Card
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
