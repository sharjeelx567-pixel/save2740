import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Receipts | Payments | Saver App',
  description: 'View and download your payment receipts',
};

export default function ReceiptsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/payments" className="text-brand-green hover:text-brand-green/90 text-sm mb-4 inline-block">
          ← Back to Payments
        </Link>

        <h1 className="text-3xl font-bold mb-2">Payment Receipts</h1>
        <p className="text-gray-600 mb-6">View and download receipts for all your transactions</p>

        <Card className="p-8 text-center">
          <p className="text-gray-600">Receipt history interface coming soon.</p>
          <p className="text-sm text-gray-500 mt-2">All your payment receipts will appear here.</p>
        </Card>
      </div>
    </main>
  );
}
