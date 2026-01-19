import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disputes | Payments | Saver App',
  description: 'File and manage payment disputes',
};

export default function DisputesPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/payments" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
          ← Back to Payments
        </Link>

        <h1 className="text-3xl font-bold mb-2">Payment Disputes</h1>
        <p className="text-gray-600 mb-6">File and manage disputes for unauthorized or incorrect charges</p>

        <Card className="p-8 text-center">
          <p className="text-gray-600">Dispute management interface coming soon.</p>
          <p className="text-sm text-gray-500 mt-2">You can file disputes for any unauthorized transactions.</p>
        </Card>
      </div>
    </main>
  );
}
