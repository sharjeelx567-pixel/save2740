'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getWalletBalances } from '@/lib/services/payments.service';
import { formatCurrency } from '@/lib/utils';

export default function WalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 50;

  useEffect(() => {
    fetchWallets();
  }, [page]);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await getWalletBalances(page, limit);
      setWallets(response.wallets);
      setTotals(response.totals);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'user',
      title: 'User',
      render: (wallet: any) => (
        <div>
          <div className="font-medium">
            {wallet.userId.firstName} {wallet.userId.lastName}
          </div>
          <div className="text-sm text-gray-500">{wallet.userId.email}</div>
        </div>
      )
    },
    {
      key: 'balance',
      title: 'Total Balance',
      render: (wallet: any) => (
        <span className="font-semibold text-lg">
          {formatCurrency(wallet.balance)}
        </span>
      )
    },
    {
      key: 'availableBalance',
      title: 'Available',
      render: (wallet: any) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(wallet.availableBalance)}
        </span>
      )
    },
    {
      key: 'locked',
      title: 'Locked',
      render: (wallet: any) => (
        <span className="font-semibold text-blue-600">
          {formatCurrency(wallet.locked || 0)}
        </span>
      )
    },
    {
      key: 'escrow',
      title: 'Escrow',
      render: (wallet: any) => (
        <span className="font-semibold text-yellow-600">
          {formatCurrency(wallet.escrowBalance || 0)}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (wallet: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            wallet.status === 'active'
              ? 'bg-green-100 text-green-800'
              : wallet.status === 'frozen'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {wallet.status}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (wallet: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/users/${wallet.userId._id}`)}
        >
          View User
        </Button>
      )
    }
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Wallet Balances"
        description="View all user wallet balances and status"
      />

      {/* Total Statistics */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Balance</div>
            <div className="text-3xl font-bold">
              {formatCurrency(totals.totalBalance)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Available Balance</div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totals.totalAvailable)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Locked Balance</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totals.totalLocked)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Escrow Balance</div>
            <div className="text-3xl font-bold text-yellow-600">
              {formatCurrency(totals.totalEscrow)}
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Balance Types:</strong> Available = funds ready for use, Locked
              = funds in savings/pockets, Escrow = funds in pending transactions
            </p>
          </div>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={wallets}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(total / limit),
              onPageChange: setPage
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
