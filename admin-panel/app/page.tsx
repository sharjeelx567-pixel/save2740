'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentActivity from '@/components/dashboard/RecentActivity'
import SystemAlerts from '@/components/dashboard/SystemAlerts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Users, UserCheck, FileText, Wallet, ArrowLeftRight, CreditCard, Target, DollarSign } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'
import { dashboardService, DashboardStats } from '@/lib/services/dashboard.service'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('📊 Dashboard page mounted, loading data...')
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log('📡 Fetching dashboard stats...')
      const data = await dashboardService.getStats()
      console.log('✅ Dashboard stats loaded:', data)
      setStats(data)
    } catch (err: any) {
      console.error('❌ Dashboard stats error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
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
    )
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your Save2740 platform"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            format="number"
            icon={<Users className="h-6 w-6" />}
          />
          <StatsCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            format="number"
            icon={<UserCheck className="h-6 w-6" />}
          />
          <StatsCard
            title="Pending KYC"
            value={stats?.pendingKYC || 0}
            format="number"
            icon={<FileText className="h-6 w-6" />}
          />
          <StatsCard
            title="Total Wallet Balance"
            value={stats?.totalWalletBalance || 0}
            format="currency"
            icon={<Wallet className="h-6 w-6" />}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Daily Transactions"
            value={stats?.dailyTransactions || 0}
            format="number"
            icon={<ArrowLeftRight className="h-6 w-6" />}
          />
          <StatsCard
            title="Failed Payments"
            value={stats?.failedPayments || 0}
            format="number"
            icon={<CreditCard className="h-6 w-6" />}
          />
          <StatsCard
            title="Active Save2740 Plans"
            value={stats?.activePlans || 0}
            format="number"
            icon={<Target className="h-6 w-6" />}
          />
          <StatsCard
            title="Total Revenue"
            value={stats?.totalRevenue || 0}
            format="currency"
            icon={<DollarSign className="h-6 w-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {stats?.charts?.transactionVolume ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.transactionVolume}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value: string) => new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `$${value}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Volume']}
                        labelFormatter={(label: string) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      />
                      <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <p className="text-sm">No chart data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {stats?.charts?.userGrowth ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.charts.userGrowth}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value: string) => new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        labelFormatter={(label: string) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      />
                      <Area type="monotone" dataKey="count" stroke="#10B981" fillOpacity={1} fill="url(#colorGrowth)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <p className="text-sm">No chart data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          <SystemAlerts />
        </div>
      </div>
    </AdminLayout>
  )
}
