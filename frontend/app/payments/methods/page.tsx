import { Metadata } from 'next';
import { ManagePaymentMethods } from '@/components/payments/manage-payment-methods';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Building2, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Payment Methods | Saver App',
  description: 'Manage your bank accounts and debit cards',
};

export default function PaymentMethodsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/payments" className="text-brand-green hover:text-brand-green/90 text-sm mb-4 inline-block">
            ← Back to Payments
          </Link>
          <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
          <p className="text-gray-600">Add and manage your bank accounts and debit cards</p>
        </div>

        {/* Add Payment Method Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link href="/payments/methods/add-bank">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Add Bank Account</h3>
              </div>
              <p className="text-sm text-gray-600">Link your checking or savings account</p>
            </Card>
          </Link>

          <Link href="/payments/methods/add-card">
            <Card className="p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Add Debit Card</h3>
              </div>
              <p className="text-sm text-gray-600">Add your debit card for payments</p>
            </Card>
          </Link>
        </div>

        {/* Payment Methods List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Your Payment Methods</h2>
          <ManagePaymentMethods />
        </Card>
      </div>
    </main>
  );
}
