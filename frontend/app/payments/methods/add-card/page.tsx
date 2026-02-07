'use client';

import { AddDebitCard } from '@/components/payments/add-debit-card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Note: Metadata export not allowed in client components
// export const metadata: Metadata = {
//   title: 'Add Debit Card | Payments | Saver App',
//   description: 'Add your debit card for faster transactions',
// };

export default function AddCardPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/payments/methods" className="text-brand-green hover:text-brand-green/90 text-sm mb-4 inline-block">
          ← Back
        </Link>

        <AddDebitCard
          onSuccess={() => {
            router.push('/payments/methods');
          }}
        />
      </div>
    </main>
  );
}

