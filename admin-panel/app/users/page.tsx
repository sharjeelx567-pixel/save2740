'use client'


import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { TableSkeleton } from '@/components/ui/SkeletonLoader'
import EmptyState from '@/components/ui/EmptyState'
import { Search, Eye, Lock, Unlock, Ban, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { usersService } from '@/lib/services/users.service'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  accountStatus: string
  kycStatus: string
  wallet?: {
    balance: number
    availableBalance: number
    locked: boolean
  }
  lastLogin?: string
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [page, statusFilter, kycFilter])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadUsers()
      } else {
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await usersService.getUsers({
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        kycStatus: kycFilter !== 'all' ? kycFilter : undefined
      })

      setUsers(response.data.users || [])
      setPagination(response.data.pagination)
    } catch (err: any) {
      console.error('Failed to load users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'lock' | 'unlock' | 'suspend') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      setActionLoading(userId)

      if (action === 'lock') {
        await usersService.lockUser(userId)
      } else if (action === 'unlock') {
        await usersService.unlockUser(userId)
      } else if (action === 'suspend') {
        await usersService.suspendUser(userId)
      }

      // Reload users after action
      await loadUsers()
    } catch (err: any) {
      console.error(`Failed to ${action} user:`, err)
      alert(`Failed to ${action} user: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      active: 'success',
      suspended: 'warning',
      locked: 'danger',
      deleted: 'default'
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getKycBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      approved: 'success',
      pending: 'warning',
      rejected: 'danger',
      not_submitted: 'info',
      none: 'info'
    }
    const label = status === 'not_submitted' || status === 'none' ? 'Not Submitted' : status
    return <Badge variant={variants[status] || 'default'}>{label}</Badge>
  }

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <PageHeader
          title="User Management"
          description="Manage all users on the platform"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Users' }
          ]}
        />
        <div className="p-6 space-y-6 animate-fade-in">
          {/* Filters Skeleton */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="skeleton h-10 w-full md:col-span-2" />
                <div className="skeleton h-10 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Table Skeleton */}
          <Card>
            <CardContent className="p-6">
              <TableSkeleton rows={10} columns={7} />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <PageHeader
          title="User Management"
          description="Manage all users on the platform"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Users' }
          ]}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadUsers}>Retry</Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <PageHeader
        title="User Management"
        description="Manage all users on the platform"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Users' }
        ]}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="locked">Locked</option>
              </Select>
              <Select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}>
                <option value="all">All KYC Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="not_submitted">Not Submitted</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <EmptyState
                icon={<Search className="w-12 h-12" />}
                title="No users found"
                description="Try adjusting your filters or search query"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Wallet Balance</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                      <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                      <TableCell className="font-medium">
                        {user.wallet ? formatCurrency(user.wallet.balance) : '$0.00'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDateTime(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/users/${user.id}`}>
                            <Button size="sm" variant="ghost" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {user.accountStatus === 'locked' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Unlock User"
                              onClick={() => handleUserAction(user.id, 'unlock')}
                              disabled={actionLoading === user.id}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Lock User"
                              onClick={() => handleUserAction(user.id, 'lock')}
                              disabled={actionLoading === user.id}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                          {user.accountStatus !== 'suspended' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Suspend User"
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              disabled={actionLoading === user.id}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total.toLocaleString()}</span> users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
