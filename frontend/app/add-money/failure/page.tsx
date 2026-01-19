"use client";

import { XCircle, RefreshCw, Home, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function TopUpFailureContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason") || "Transaction failed";
    const amount = searchParams.get("amount") || "0.00";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
                {/* Error Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <div className="relative bg-red-500 rounded-full p-6">
                            <XCircle className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                    Top-Up Failed
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    We couldn't process your payment
                </p>

                {/* Failed Amount */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 mb-6 border-2 border-red-200">
                    <p className="text-sm text-gray-600 text-center mb-2">Attempted Amount</p>
                    <p className="text-4xl font-bold text-red-600 text-center">
                        ${parseFloat(amount).toFixed(2)}
                    </p>
                </div>

                {/* Error Details */}
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-gray-900 mb-1">Reason</p>
                            <p className="text-sm text-gray-700">{reason}</p>
                        </div>
                    </div>
                </div>

                {/* Common Reasons */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="font-semibold text-gray-900 mb-3 text-sm">Common reasons:</p>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>Insufficient funds in your payment method</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>Payment declined by your bank</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>Network or connectivity issues</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5">•</span>
                            <span>Incorrect payment details</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={() => router.push("/add-money")}
                        className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-3 rounded-xl gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </Button>

                    <Button
                        onClick={() => router.push("/my-wallet")}
                        variant="outline"
                        className="w-full border-2 border-gray-300 hover:border-brand-green hover:bg-emerald-50 font-semibold py-3 rounded-xl gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Back to Wallet
                    </Button>

                    <Link
                        href="mailto:support@save2740.com"
                        className="flex items-center justify-center w-full text-gray-600 hover:text-brand-green font-medium py-2 gap-2"
                    >
                        <HeadphonesIcon className="w-4 h-4" />
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function TopUpFailurePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <TopUpFailureContent />
        </Suspense>
    );
}
