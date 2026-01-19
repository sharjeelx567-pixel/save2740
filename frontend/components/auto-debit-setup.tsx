"use client"

import { useState } from "react"
import { Repeat2, Edit2, Trash2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AutoDebitSetup {
  id: string
  name: string
  amount: number
  frequency: "daily" | "weekly" | "monthly"
  paymentMethod: string
  merchant?: string
  nextDebitDate: Date
  status: "active" | "paused" | "inactive"
  startDate: Date
  endDate?: Date
}

/**
 * AutoDebitSetup Component
 * Configure and manage automatic debit arrangements
 */
export function AutoDebitSetup({
  onComplete,
}: {
  onComplete?: (setup: Partial<AutoDebitSetup>) => void
}) {
  const [step, setStep] = useState<"welcome" | "details" | "review" | "confirm">(
    "welcome"
  )
  const [setup, setSetup] = useState<Partial<AutoDebitSetup>>({
    frequency: "monthly",
    status: "inactive",
  })

  const frequencies = [
    { value: "daily", label: "Daily", desc: "Every day at 9:00 AM" },
    { value: "weekly", label: "Weekly", desc: "Every Monday at 9:00 AM" },
    { value: "monthly", label: "Monthly", desc: "1st of every month at 9:00 AM" },
  ]

  const handleNext = () => {
    if (step === "welcome") setStep("details")
    else if (step === "details") setStep("review")
    else if (step === "review") setStep("confirm")
  }

  const handleBack = () => {
    if (step === "details") setStep("welcome")
    else if (step === "review") setStep("details")
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Set Up Auto-Debit</h2>
        <p className="text-slate-600">
          Automate your regular payments and never miss a deadline
        </p>
      </div>

      {step === "welcome" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-8 space-y-4">
            <div className="flex gap-4">
              <Repeat2 className="w-8 h-8 text-brand-green flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Automatic Recurring Payments
                </h3>
                <ul className="space-y-2 text-slate-700 text-sm">
                  <li>✓ Save time with automatic transfers</li>
                  <li>✓ Never worry about missed payments</li>
                  <li>✓ Manage multiple recurring payments</li>
                  <li>✓ Pause or cancel anytime</li>
                </ul>
              </div>
            </div>
          </div>

          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-5 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Please verify your bank account</p>
                <p className="mt-1">
                  You'll need a verified bank account or debit card to enable auto-debits.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-6">
          {/* Debit Name */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">
              What would you like to call this auto-debit? *
            </label>
            <input
              type="text"
              placeholder="e.g., Netflix Subscription, Rent Payment"
              value={setup.name || ""}
              onChange={(e) => setSetup({ ...setup, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">
              How much to transfer each time? *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-700">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={setup.amount || ""}
                onChange={(e) =>
                  setSetup({ ...setup, amount: parseFloat(e.target.value) })
                }
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-2xl font-bold"
              />
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <label className="block font-semibold text-slate-700">
              How often should we debit? *
            </label>
            <div className="space-y-2">
              {frequencies.map((freq) => (
                <label
                  key={freq.value}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                    setup.frequency === freq.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={freq.value}
                    checked={setup.frequency === freq.value}
                    onChange={(e) =>
                      setSetup({
                        ...setup,
                        frequency: e.target.value as any,
                      })
                    }
                    className="w-5 h-5"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{freq.label}</p>
                    <p className="text-sm text-slate-600">{freq.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">
              When should the first debit occur? *
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!setup.name || !setup.amount || !setup.frequency}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Review Setup
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-6">
          <Card className="border-2 border-slate-200">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Review Your Auto-Debit Setup
              </h3>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-600">Name</span>
                  <span className="font-semibold text-slate-900">{setup.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount</span>
                  <span className="text-2xl font-bold text-slate-900">
                    ${setup.amount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Frequency</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {setup.frequency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method</span>
                  <span className="font-semibold text-slate-900">
                    Visa •••• 4242
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Next Debit:</span> January 3, 2026
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Confirm Setup
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-6 text-center py-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <Repeat2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Auto-Debit Enabled</h3>
            <p className="text-slate-600">
              Your automatic payment of{" "}
              <span className="font-bold">${setup.amount?.toFixed(2)}</span> {setup.frequency}{" "}
              for "{setup.name}" is now active.
            </p>
          </div>

          <Card className="border-2 border-slate-200 bg-slate-50">
            <CardContent className="p-4 text-left text-sm space-y-2">
              <p className="text-slate-600">
                <span className="font-semibold">First debit:</span> January 3, 2026
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">Status:</span> Active
              </p>
              <p className="text-slate-600">
                <span className="font-semibold">Reference:</span> ABD123456
              </p>
            </CardContent>
          </Card>

          <button
            onClick={onComplete}
            className="w-full px-6 py-3 bg-brand-green text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            Back to Wallet
          </button>
        </div>
      )}
    </div>
  )
}
