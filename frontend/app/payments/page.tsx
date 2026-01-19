import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreditCard, Zap, ReceiptText, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Payments & Banking | Saver App',
  description: 'Manage payments, auto-debits, and banking',
};

export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Payments & Banking</h1>
        <p className="text-gray-600 mb-6">Manage your payment methods, auto-debits, and payment history</p>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link href="/payments/methods">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-6 h-6 text-brand-green" />
                <h3 className="font-bold">Payment Methods</h3>
              </div>
              <p className="text-sm text-gray-600">
                Manage your bank accounts and debit cards
              </p>
            </Card>
          </Link>

          <Link href="/payments/auto-debit">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-green-600" />
                <h3 className="font-bold">Auto-Debits</h3>
              </div>
              <p className="text-sm text-gray-600">
                Set up and manage automatic payments
              </p>
            </Card>
          </Link>

          <Link href="/payments/receipts">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <ReceiptText className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold">Receipts</h3>
              </div>
              <p className="text-sm text-gray-600">
                View and download payment receipts
              </p>
            </Card>
          </Link>

          <Link href="/payments/disputes">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h3 className="font-bold">Disputes</h3>
              </div>
              <p className="text-sm text-gray-600">
                File and manage payment disputes
              </p>
            </Card>
          </Link>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-bold mb-3">Supported Payment Methods</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Bank Accounts (Checking & Savings)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Debit Cards (Visa, Mastercard, Amex)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                ACH Transfers
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Instant Verification
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-bold mb-3">Security Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                End-to-end encryption
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                2FA for high-value transactions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Fraud detection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Chargeback protection
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}
