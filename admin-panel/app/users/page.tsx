'use client'


import { useState, useEffect, useMemo } from 'react'
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
import { FilterChips, FilterChip } from '@/components/ui/FilterChips'
import { Search, Eye, Lock, Unlock, Ban, AlertCircle, Filter, X } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { usersService } from '@/lib/services/users.service'

interface User {
  id: string
  _id?: string
  email: string
  firstName: string
  lastName: string
  accountStatus: string
  kycStatus: string
  financialRole?: 'inactive' | 'saver' | 'contribution_member' | 'saver_and_contribution_member'
  financialRoleLabel?: string
  walletBalance?: number
  availableBalance?: number
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
  const [financialRoleFilter, setFinancialRoleFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
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
  }, [page, statusFilter, kycFilter, financialRoleFilter, dateFrom, dateTo])

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

  const activeFilterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = []
    if (statusFilter !== 'all') chips.push({ key: 'status', label: 'Status', value: statusFilter })
    if (kycFilter !== 'all') chips.push({ key: 'kyc', label: 'KYC', value: kycFilter })
    if (financialRoleFilter !== 'all') chips.push({ key: 'memberType', label: 'Member type', value: financialRoleFilter === 'saver_and_contribution_member' ? 'Saver & Contribution Member' : financialRoleFilter })
    if (dateFrom) chips.push({ key: 'dateFrom', label: 'From', value: dateFrom })
    if (dateTo) chips.push({ key: 'dateTo', label: 'To', value: dateTo })
    return chips
  }, [statusFilter, kycFilter, financialRoleFilter, dateFrom, dateTo])

  const removeFilter = (key: string) => {
    if (key === 'status') setStatusFilter('all')
    if (key === 'kyc') setKycFilter('all')
    if (key === 'memberType') setFinancialRoleFilter('all')
    if (key === 'dateFrom') setDateFrom('')
    if (key === 'dateTo') setDateTo('')
    setPage(1)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setKycFilter('all')
    setFinancialRoleFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await usersService.getUsers({
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        kycStatus: kycFilter !== 'all' ? kycFilter : undefined,
        financialRole: financialRoleFilter !== 'all' ? financialRoleFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })

      const userList = response.data?.users || []
      setUsers(userList.map((u: any) => ({ ...u, id: u.id || u._id })))
      setPagination(response.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
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
        <div className="space-y-6 animate-fade-in">
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

      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            {/* Mobile: Filter toggle */}
            <div className="flex flex-wrap items-center gap-2 mb-4 md:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                aria-expanded={filtersOpen}
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterChips.length > 0 && (
                  <span className="bg-brand-green text-white text-xs rounded-full px-2 py-0.5">{activeFilterChips.length}</span>
                )}
              </button>
              {activeFilterChips.length > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="h-4 w-4" /> Reset
                </button>
              )}
            </div>

            <div className={`grid grid-cols-1 gap-4 ${filtersOpen ? 'block' : 'hidden'} md:grid md:grid-cols-2 lg:grid-cols-4 md:!block`}>
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search users by name or email"
                />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by account status">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="locked">Locked</option>
              </Select>
              <Select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} aria-label="Filter by KYC status">
                <option value="all">All KYC Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="not_submitted">Not Submitted</option>
              </Select>
              <Select value={financialRoleFilter} onChange={(e) => setFinancialRoleFilter(e.target.value)} aria-label="Filter by member type">
                <option value="all">All Member Types</option>
                <option value="saver">Saver</option>
                <option value="contribution_member">Contribution Member</option>
                <option value="saver_and_contribution_member">Saver & Contribution Member</option>
                <option value="inactive">Inactive</option>
              </Select>
              <div className="flex flex-wrap gap-2 lg:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="shrink-0">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    aria-label="Filter from date"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="shrink-0">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    aria-label="Filter to date"
                  />
                </label>
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <FilterChips chips={activeFilterChips} onRemove={removeFilter} onReset={resetFilters} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Table/List */}
        <Card>
          <CardContent className="p-0 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg" aria-live="polite" aria-busy="true">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-green border-t-transparent" />
              </div>
            )}
            {users.length === 0 && !loading ? (
              <EmptyState
                icon={<Search className="w-12 h-12" />}
                title="No users found"
                description="Try adjusting your filters or search query"
              />
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Financial Role</TableHead>
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
                        <TableRow key={user.id || (user as any)._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium text-gray-700" title="Based on savings and group activity">
                              {user.financialRoleLabel ?? 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                          <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(user.walletBalance ?? user.wallet?.balance ?? 0)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{formatDateTime(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/users/${user.id || (user as any)._id}`}>
                                <Button size="sm" variant="ghost" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {user.accountStatus === 'locked' ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Unlock User"
                                  onClick={() => handleUserAction(user.id || (user as any)._id, 'unlock')}
                                  disabled={actionLoading === (user.id || (user as any)._id)}
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Lock User"
                                  onClick={() => handleUserAction(user.id || (user as any)._id, 'lock')}
                                  disabled={actionLoading === (user.id || (user as any)._id)}
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              )}
                              {user.accountStatus !== 'suspended' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Suspend User"
                                  onClick={() => handleUserAction(user.id || (user as any)._id, 'suspend')}
                                  disabled={actionLoading === (user.id || (user as any)._id)}
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
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4 p-4">
                  {users.map((user) => (
                    <div key={user.id || (user as any)._id} className="border rounded-lg p-4 shadow-sm bg-gray-50/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        {getStatusBadge(user.accountStatus)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="bg-white p-2 rounded border border-gray-100">
                          <p className="text-xs text-gray-500">Financial Role</p>
                          <p className="font-medium text-gray-800">{user.financialRoleLabel ?? 'Inactive'}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-100">
                          <p className="text-xs text-gray-500">Wallet</p>
                          <p className="font-bold">{formatCurrency(user.walletBalance ?? user.wallet?.balance ?? 0)}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-100">
                          <p className="text-xs text-gray-500">KYC</p>
                          <div>{getKycBadge(user.kycStatus)}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/users/${user.id || (user as any)._id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </Link>

                        {user.accountStatus === 'locked' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleUserAction(user.id || (user as any)._id, 'unlock')}
                            disabled={actionLoading === (user.id || (user as any)._id)}
                          >
                            <Unlock className="h-4 w-4 mr-2" /> Unlock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleUserAction(user.id || (user as any)._id, 'lock')}
                            disabled={actionLoading === (user.id || (user as any)._id)}
                          >
                            <Lock className="h-4 w-4 mr-2" /> Lock
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
