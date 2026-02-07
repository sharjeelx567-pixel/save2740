'use client';

import { Metadata } from 'next';
import { AddBankAccount } from '@/components/payments/add-bank-account';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Note: Metadata export not allowed in client components
// export const metadata: Metadata = {
//   title: 'Add Bank Account | Payments | Saver App',
//   description: 'Link your bank account for deposits and transfers',
// };

export default function AddBankPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-md mx-auto">
        <Link href="/payments/methods" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
          ← Back
        </Link>

        <AddBankAccount
          onSuccess={() => {
            router.push('/payments/methods');
          }}
        />
      </div>
    </main>
  );
}

