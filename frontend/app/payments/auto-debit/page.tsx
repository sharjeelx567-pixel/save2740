import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Auto-Debits | Payments | Saver App',
  description: 'Manage your automatic payments and recurring debits',
};

export default function AutoDebitPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/payments" className="text-brand-green hover:text-brand-green/90 text-sm mb-4 inline-block">
          ← Back to Payments
        </Link>

        <h1 className="text-3xl font-bold mb-2">Auto-Debits</h1>
        <p className="text-gray-600 mb-6">Set up and manage automatic recurring payments</p>

        <Card className="p-8 text-center">
          <p className="text-gray-600">Auto-debit management interface coming soon.</p>
          <p className="text-sm text-gray-500 mt-2">Use the components to build your auto-debit workflow.</p>
        </Card>
      </div>
    </main>
  );
}

