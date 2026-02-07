'use client';


import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatsCard from '@/components/ui/StatsCard';
import DataTable from '@/components/ui/DataTable';
import { StatCardSkeleton } from '@/components/ui/SkeletonLoader';
import { dashboardService } from '@/lib/services/dashboard.service';
import {
  Users,
  UserCheck,
  FileCheck,
  Wallet,
  Activity,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingKYC: 0,
    totalWalletBalance: 0,
    dailyTransactions: 0,
    failedPayments: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real data from backend
      const statsData = await dashboardService.getStats();
      setStats(statsData);

      const activityData = await dashboardService.getRecentActivity();
      setRecentActivity(activityData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const activityColumns = [
    {
      key: 'type',
      title: 'Activity Type',
      render: (item: any) => <span className="font-medium">{item.type}</span>,
    },
    {
      key: 'user',
      title: 'User',
    },
    {
      key: 'time',
      title: 'Time',
      render: (item: any) => <span className="text-slate-500">{item.time}</span>,
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-emerald-600"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back, here's what's happening today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatsCard
            title="Active Users (30d)"
            value={stats.activeUsers.toLocaleString()}
            icon={UserCheck}
            iconColor="text-brand-green"
            iconBg="bg-emerald-50"
          />
          <StatsCard
            title="Pending KYC"
            value={stats.pendingKYC}
            change={stats.pendingKYC > 0 ? "Requires attention" : undefined}
            changeType={stats.pendingKYC > 0 ? "neutral" : undefined}
            icon={FileCheck}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-50"
          />
          <StatsCard
            title="Total Wallet Balance"
            value={`$${stats.totalWalletBalance.toLocaleString()}`}
            icon={Wallet}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatsCard
            title="Daily Transactions"
            value={stats.dailyTransactions}
            icon={Activity}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatsCard
            title="Failed Payments (Today)"
            value={stats.failedPayments}
            change={stats.failedPayments > 5 ? "Investigate issue" : undefined}
            changeType={stats.failedPayments > 5 ? "neutral" : undefined}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            <Link
              href="/logs"
              className="text-brand-green hover:text-emerald-600 font-medium focus-ring rounded px-2 py-1"
            >
              View all →
            </Link>
          </div>
          <DataTable
            columns={activityColumns}
            data={recentActivity}
            loading={false}
            emptyMessage="No recent activity"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/kyc"
            className="bg-white rounded-xl border border-slate-200 p-6 card-hover focus-ring"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <FileCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Review KYC</h3>
                <p className="text-slate-600">{stats.pendingKYC} pending requests</p>
              </div>
            </div>
          </Link>

          <Link
            href="/users"
            className="bg-white rounded-xl border border-slate-200 p-6 card-hover focus-ring"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Manage Users</h3>
                <p className="text-slate-600">{stats.totalUsers} total users</p>
              </div>
            </div>
          </Link>

          <Link
            href="/support/live-chat"
            className="bg-white rounded-xl border border-slate-200 p-6 card-hover focus-ring"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Live Support Chat</h3>
                <p className="text-slate-600">Chat with users in real-time</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
