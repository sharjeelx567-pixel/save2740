'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { Shield, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function LogsPage() {
  const [actionFilter, setActionFilter] = useState('all')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLogs: 0,
    recentLogs: 0,
    criticalLogs: 0,
    errorLogs: 0
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api/admin/audit-logs/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.data)
      }

      // Fetch Logs
      let query = ''
      if (actionFilter !== 'all') {
        // Map simplified filter to resourceType or action regex
        if (actionFilter === 'kyc') query = '?resourceType=kyc_document' // Assumption on resourceType
        else if (actionFilter === 'wallet') query = '?resourceType=wallet'
        else if (actionFilter === 'user') query = '?resourceType=user'
        else if (actionFilter === 'support') query = '?resourceType=support_ticket'
      }

      const logsRes = await fetch(`http://localhost:5000/api/admin/audit-logs${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const logsData = await logsRes.json()
      if (logsData.success) {
        setLogs(logsData.data.logs)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }, [actionFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Helper to format action string
  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Admin Activity Logs"
        description="Track all admin actions and changes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Admin Logs' }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions (All Time)</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalLogs}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.recentLogs} in last 7 days</p>
              </div>
              <div className="p-3 bg-brand-green/10 rounded-lg">
                <Shield className="h-6 w-6 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Resource:</label>
              <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="w-64">
                <option value="all">All Resources</option>
                <option value="kyc">KYC</option>
                <option value="wallet">Wallet</option>
                <option value="user">User</option>
                <option value="support">Support</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex justify-center items-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No activity logs found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{formatAction(log.action)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        {log.resourceType}:{log.resourceId?.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate" title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}>
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '-')}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
