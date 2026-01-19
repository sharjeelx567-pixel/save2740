"use client";

import { CheckCircle, ArrowRight, Home, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function TopUpSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0.00";
    const transactionId = searchParams.get("transactionId") || "N/A";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-2xl animate-pulse"></div>
                        <div className="relative bg-brand-green rounded-full p-6">
                            <CheckCircle className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                    Top-Up Successful!
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Your wallet has been credited successfully
                </p>

                {/* Amount Display */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border-2 border-brand-green/20">
                    <p className="text-sm text-gray-600 text-center mb-2">Amount Added</p>
                    <p className="text-4xl font-bold text-brand-green text-center">
                        ${parseFloat(amount).toFixed(2)}
                    </p>
                </div>

                {/* Transaction Details */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Transaction ID</span>
                        <span className="font-mono font-semibold text-gray-900">{transactionId}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Date & Time</span>
                        <span className="font-semibold text-gray-900">{new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status</span>
                        <span className="flex items-center gap-1 text-brand-green font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={() => router.push("/my-wallet")}
                        className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-3 rounded-xl gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Back to Wallet
                    </Button>

                    <Link
                        href={`/wallet-transactions?highlight=${transactionId}`}
                        className="flex items-center justify-center w-full border-2 border-gray-300 hover:border-brand-green hover:bg-emerald-50 text-gray-700 hover:text-brand-green font-semibold py-3 rounded-xl transition-all gap-2"
                    >
                        <Receipt className="w-5 h-5" />
                        View Transaction
                    </Link>

                    <Link
                        href="/"
                        className="block text-center text-gray-600 hover:text-gray-900 font-medium py-2"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function TopUpSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <TopUpSuccessContent />
        </Suspense>
    );
}
