"use client"

import { ProtectedPage } from "@/components/protected-page"

import { useState } from "react"
import { CreditCard, Trash2, Plus, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface PaymentMethod {
  id: string
  type: "card" | "bank"
  name: string
  last4: string
  expiryOrBank: string
  isDefault: boolean
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "1",
    type: "card",
    name: "Visa",
    last4: "4242",
    expiryOrBank: "12/25",
    isDefault: true,
  },
  {
    id: "2",
    type: "bank",
    name: "Chase Bank",
    last4: "6789",
    expiryOrBank: "Checking Account",
    isDefault: false,
  },
]

export function PaymentMethodCard({ method }: { method: PaymentMethod }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-slate-100 p-3 rounded-lg">
          <CreditCard className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800">{method.name}</p>
            {method.isDefault && (
              <span className="bg-emerald-50 text-brand-green text-xs font-medium px-2 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            •••• {method.last4} • {method.expiryOrBank}
          </p>
        </div>
      </div>
      <button className="text-slate-400 hover:text-red-500 transition-colors p-2">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

function PaymentMethodsPageContent() {
  const [paymentMethods, setPaymentMethods] = useState(MOCK_PAYMENT_METHODS)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [addMethodType, setAddMethodType] = useState<"card" | "bank" | null>(null)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Methods</h1>
          <p className="text-slate-600">Manage your payment methods for wallet funding</p>
        </div>

        {/* Current Payment Methods */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Your Payment Methods</h2>
            <div className="space-y-3">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <PaymentMethodCard key={method.id} method={method} />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600">No payment methods added yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Payment Method */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Add Payment Method</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Add Debit Card */}
              <button
                onClick={() => {
                  setAddMethodType("card")
                  setOpenAddDialog(true)
                }}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-brand-green hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <CreditCard className="w-8 h-8 text-brand-green" />
                <span className="font-semibold text-slate-700">Add Debit Card</span>
                <span className="text-xs text-slate-600">Visa, Mastercard, Amex</span>
              </button>

              {/* Add Bank Account */}
              <button
                onClick={() => {
                  setAddMethodType("bank")
                  setOpenAddDialog(true)
                }}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-brand-green hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <CreditCard className="w-8 h-8 text-brand-green" />
                <span className="font-semibold text-slate-700">Add Bank Account</span>
                <span className="text-xs text-slate-600">ACH / Direct Debit</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-brand-green mb-2">💡 Tip: ACH is cheaper</h3>
          <p className="text-sm text-brand-green/80">
            Bank account transfers (ACH) have lower fees than card payments and are recommended for regular wallet top-ups.
          </p>
        </div>
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {addMethodType === "card" ? "Add Debit Card" : "Add Bank Account"}
            </DialogTitle>
            <DialogDescription>
              {addMethodType === "card"
                ? "Enter your debit card details securely"
                : "Connect your bank account for ACH transfers"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {addMethodType === "card" ? (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Chase Bank"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Account Number
                  </label>
                  <input
                    type="password"
                    placeholder="•••••••••••••••"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 021000021"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" id="default" className="rounded" />
              <label htmlFor="default" className="text-sm text-slate-700">
                Set as default payment method
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpenAddDialog(false)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setOpenAddDialog(false)}
              className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green/90 transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PaymentMethodsPage() {
  return (
    <ProtectedPage>
      <PaymentMethodsPageContent />
    </ProtectedPage>
  )
}

