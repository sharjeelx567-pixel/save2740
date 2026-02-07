'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getPayments, getPaymentStats } from '@/lib/services/payments.service';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  transactionId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  successfulCount: number;
  successfulAmount: number;
  failedCount: number;
  pendingCount: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    startDate: '',
    endDate: ''
  });

  const limit = 50;

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [page, filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await getPayments({
        page,
        limit,
        ...filters
      });
      setPayments(response.payments);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getPaymentStats('30d');
      setStats(response.overall);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'transactionId',
      title: 'Transaction ID',
      render: (payment: Payment) => (
        <span className="font-mono text-sm">{payment.transactionId}</span>
      )
    },
    {
      key: 'user',
      title: 'User',
      render: (payment: Payment) => (
        <div>
          <div className="font-medium">
            {payment.userId.firstName} {payment.userId.lastName}
          </div>
          <div className="text-sm text-gray-500">{payment.userId.email}</div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (payment: Payment) => (
        <span className="capitalize">{payment.type.replace('_', ' ')}</span>
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (payment: Payment) => (
        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (payment: Payment) => (
        <Badge variant={getStatusBadgeVariant(payment.status)}>
          {payment.status}
        </Badge>
      )
    },
    {
      key: 'date',
      title: 'Date',
      render: (payment: Payment) => (
        <div className="text-sm">
          {formatDate(payment.createdAt)}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (payment: Payment) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/payments/${payment.transactionId}`)}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Payments Management"
        description="View and manage all payment transactions"
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Transactions</div>
            <div className="text-3xl font-bold">{stats.totalTransactions}</div>
            <div className="text-sm text-gray-500 mt-1">
              {formatCurrency(stats.totalAmount)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Successful</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.successfulCount}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatCurrency(stats.successfulAmount)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Failed</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.failedCount}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pendingCount}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="refund">Refund</option>
              <option value="fee">Fee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                status: 'all',
                type: 'all',
                startDate: '',
                endDate: ''
              });
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
          <Button onClick={() => setPage(1)}>Apply Filters</Button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={payments}
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
