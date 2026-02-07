"use client"

import { ProtectedPage } from "@/components/protected-page"
import { useState, useEffect } from "react"
import { CreditCard, Trash2, Check, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { AddDebitCardModal } from "@/components/payments/add-debit-card-modal"
import { AddBankAccountModal } from "@/components/payments/add-bank-account-modal"

interface PaymentMethod {
  id: string
  type: "card" | "bank"
  name: string
  last4: string
  expiryOrBank: string
  isDefault: boolean
}

export function PaymentMethodCard({ method, onDelete, onSetDefault }: {
  method: PaymentMethod,
  onDelete: (id: string) => void,
  onSetDefault: (id: string) => void
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => !method.isDefault && onSetDefault(method.id)}>
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Are you sure you want to remove this payment method?")) {
            onDelete(method.id);
          }
        }}
        className="text-slate-400 hover:text-red-500 transition-colors p-2"
        title="Remove payment method"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

function PaymentMethodsPageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddCardDialog, setOpenAddCardDialog] = useState(false)
  const [openAddBankDialog, setOpenAddBankDialog] = useState(false)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [addMethodType, setAddMethodType] = useState<'card' | 'bank'>('card')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: '', expiry: '', cvc: '',
    bankName: '', accountNumber: '', routingNumber: '',
    isDefault: false
  })


  const fetchPaymentMethods = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<any>('/api/payment-methods')
      // API returns { success, data: { success, data: [...] } } due to double wrapping
      const methods = response.data?.data || response.data || []
      
      if (response.success && Array.isArray(methods)) {
        const mappedMethods: PaymentMethod[] = methods.map((m: any) => {
          // Format expiry from expMonth/expYear
          const expiryStr = m.expMonth && m.expYear 
            ? `${String(m.expMonth).padStart(2, '0')}/${String(m.expYear).slice(-2)}`
            : '**/**';
          
          return {
            id: m._id || m.id,
            type: (m.type === 'debit' || m.type === 'credit' || m.type === 'card') ? 'card' : 'bank',
            name: m.name || m.bankName || (m.brand ? `${m.brand.toUpperCase()} Card` : 'Payment Method'),
            last4: m.last4 || '••••',
            expiryOrBank: m.type === 'bank' ? (m.accountType || 'Checking') : expiryStr,
            isDefault: m.isDefault || false
          };
        });
        setPaymentMethods(mappedMethods)
      } else {
        setPaymentMethods([])
      }
    } catch (err) {
      console.error("Failed to fetch payment methods", err)
      toast.error("Failed to load payment methods")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (processingId) return // Prevent multiple clicks
    setProcessingId(id)
    try {
      // Use DELETE method as per v2 API spec
      await apiClient.delete(`/api/payment-methods/${id}`)
      setPaymentMethods(prev => prev.filter(m => m.id !== id))
      toast.success("Payment method removed")
    } catch (err) {
      toast.error("Failed to delete payment method")
    } finally {
      setProcessingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    if (processingId) return // Prevent multiple clicks
    setProcessingId(id)
    try {
      // Optimistic UI update
      setPaymentMethods(prev => prev.map(m => ({
        ...m,
        isDefault: m.id === id
      })))

      // Use PUT method as per v2 API spec
      await apiClient.put(`/api/payment-methods/${id}/default`, {})
      toast.success("Default payment method updated")
    } catch (err) {
      fetchPaymentMethods() // Revert on error
      toast.error("Failed to update default method")
    } finally {
      setProcessingId(null)
    }
  }

  const handleAddSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      // Construct payload based on type
      const payload: any = {
        type: addMethodType === 'card' ? 'card' : 'bank',
        isDefault: formData.isDefault
      }

      if (addMethodType === 'card') {
        payload.cardNumber = formData.cardNumber.replace(/\s/g, '')
        payload.expiry = formData.expiry
        payload.cvc = formData.cvc
      } else {
        payload.bankName = formData.bankName
        payload.accountNumber = formData.accountNumber
        payload.routingNumber = formData.routingNumber
        payload.accountType = 'checking' // Defaulting for simplicity
      }

      const response = await apiClient.post('/api/payment-methods', payload)

      if (response.success) {
        setOpenAddDialog(false)
        fetchPaymentMethods()
        setFormData({
          cardNumber: '', expiry: '', cvc: '',
          bankName: '', accountNumber: '', routingNumber: '',
          isDefault: false
        })
        toast.success("Payment method added successfully")
      } else {
        setError(response.error?.error || "Failed to add payment method")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Desktop Sidebar - always visible on this page */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        <DashboardHeader title="Payment Methods" onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex justify-between items-start gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Payment Methods</h1>
            <p className="text-sm sm:text-base text-slate-600">Manage your payment methods for wallet funding</p>
          </div>
          <button
            onClick={fetchPaymentMethods}
            className="p-2 text-slate-400 hover:text-brand-green transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Current Payment Methods */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Your Payment Methods</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                </div>
              ) : paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onDelete={handleDelete}
                    onSetDefault={handleSetDefault}
                  />
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
                onClick={() => setOpenAddCardDialog(true)}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-brand-green hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <CreditCard className="w-8 h-8 text-brand-green" />
                <span className="font-semibold text-slate-700">Add Debit Card</span>
                <span className="text-xs text-slate-600">Visa, Mastercard, Amex</span>
              </button>

              {/* Add Bank Account */}
              <button
                onClick={() => setOpenAddBankDialog(true)}
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
        <div className="mt-6 sm:mt-8 bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-brand-green mb-2">💡 Tip: ACH is cheaper</h3>
          <p className="text-sm text-brand-green/80">
            Bank account transfers (ACH) have lower fees than card payments and are recommended for regular wallet top-ups.
          </p>
        </div>
          </div>
        </div>
      </main>
    </div>

    {/* Add Payment Method Modals */}
      <AddDebitCardModal
        isOpen={openAddCardDialog}
        onClose={() => setOpenAddCardDialog(false)}
        onSuccess={() => {
          fetchPaymentMethods()
          setOpenAddCardDialog(false)
        }}
      />
      <AddBankAccountModal
        isOpen={openAddBankDialog}
        onClose={() => setOpenAddBankDialog(false)}
        onSuccess={() => {
          fetchPaymentMethods()
          setOpenAddBankDialog(false)
        }}
      />

      {/* Legacy Dialog - Remove after testing */}
      <Dialog open={false} onOpenChange={() => {}}>
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
                    value={formData.cardNumber}
                    onChange={e => setFormData({ ...formData, cardNumber: e.target.value })}
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
                      value={formData.expiry}
                      onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={formData.cvc}
                      onChange={e => setFormData({ ...formData, cvc: e.target.value })}
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
                    value={formData.bankName}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., Chase Bank"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
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
                    value={formData.routingNumber}
                    onChange={e => setFormData({ ...formData, routingNumber: e.target.value })}
                    placeholder="e.g., 021000021"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="default"
                className="rounded text-brand-green focus:ring-brand-green"
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              <label htmlFor="default" className="text-sm text-slate-700 select-none">
                Set as default payment method
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setOpenAddDialog(false)}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Adding...' : 'Add Payment Method'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function PaymentMethodsPage() {
  return (
    <ProtectedPage>
      <PaymentMethodsPageContent />
    </ProtectedPage>
  )
}

