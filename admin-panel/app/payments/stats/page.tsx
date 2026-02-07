'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatsCard from '@/components/ui/StatsCard';
import { getPaymentStats, calculateSuccessRate } from '@/lib/services/payments.service';
import { formatCurrency } from '@/lib/utils';

export default function PaymentStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await getPaymentStats(period);
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  const successRate = stats?.overall
    ? calculateSuccessRate(
        stats.overall.successfulCount,
        stats.overall.totalTransactions
      )
    : 0;

  return (
    <AdminLayout>
      <PageHeader
        title="Payment Statistics"
        description="Comprehensive payment analytics and insights"
      />

      {/* Period Selector */}
      <div className="mb-6 flex justify-end">
        <select
          className="border rounded-lg px-4 py-2"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* Overall Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Overall Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Transactions"
            value={stats?.overall?.totalTransactions || 0}
            subtitle={formatCurrency(stats?.overall?.totalAmount || 0)}
          />
          <StatsCard
            title="Successful"
            value={stats?.overall?.successfulCount || 0}
            subtitle={formatCurrency(stats?.overall?.successfulAmount || 0)}
            trend="positive"
          />
          <StatsCard
            title="Success Rate"
            value={`${successRate}%`}
            subtitle={`${stats?.overall?.failedCount || 0} failed`}
            trend={successRate >= 95 ? 'positive' : successRate >= 90 ? 'neutral' : 'negative'}
          />
          <StatsCard
            title="Pending"
            value={stats?.overall?.pendingCount || 0}
            subtitle="Awaiting processing"
            trend="neutral"
          />
        </div>
      </div>

      {/* By Type */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Breakdown by Type</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.byType?.map((type: any) => (
                <tr key={type._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize font-medium">
                      {type._id.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{type.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {formatCurrency(type.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(type.totalAmount / type.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Daily Trend</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-3">
            {stats?.daily?.slice(0, 10).map((day: any) => (
              <div key={day._id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{day._id}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    {day.successful}/{day.count} transactions
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(day.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top Users by Volume</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.topUsers?.map((user: any, index: number) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-400">
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.user ? (
                      <div>
                        <div className="font-medium">
                          {user.user.firstName} {user.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.user.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">User not found</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.transactionCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {formatCurrency(user.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
