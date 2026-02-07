'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/SkeletonLoader'
import { usersService } from '@/lib/services/users.service'
import { User, Mail, Phone, Calendar, Wallet, Shield, AlertCircle, Lock, Unlock, Ban, LogOut, ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await usersService.getUser(userId)
      setData(userData)
    } catch (err: any) {
      console.error('Failed to load user:', err)
      setError(err.message || 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'lock' | 'unlock' | 'suspend' | 'forceLogout') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      setActionLoading(true)
      
      if (action === 'lock') {
        await usersService.lockUser(userId)
      } else if (action === 'unlock') {
        await usersService.unlockUser(userId)
      } else if (action === 'suspend') {
        await usersService.suspendUser(userId)
      } else if (action === 'forceLogout') {
        await usersService.forceLogout(userId)
      }

      await loadUserData()
    } catch (err: any) {
      console.error(`Failed to ${action}:`, err)
      alert(`Failed to ${action}: ${err.message}`)
    } finally {
      setActionLoading(false)
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
      none: 'info',
      not_submitted: 'info'
    }
    const label = status === 'not_submitted' || status === 'none' ? 'Not Submitted' : status
    return <Badge variant={variants[status] || 'default'}>{label}</Badge>
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6 animate-fade-in">
          <div className="skeleton h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card><CardContent className="p-6"><div className="skeleton h-32 w-full" /></CardContent></Card>
              <Card><CardContent className="p-6"><div className="skeleton h-64 w-full" /></CardContent></Card>
            </div>
            <div className="space-y-6">
              <Card><CardContent className="p-6"><div className="skeleton h-48 w-full" /></CardContent></Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'User not found'}</p>
            <Button onClick={() => router.push('/users')}>Back to Users</Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const user = data.user || data

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Back Button */}
        <Link href="/users" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 focus-ring rounded px-2 py-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>

        <PageHeader
          title={`${user.firstName} ${user.lastName}`}
          description={user.email}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Users', href: '/users' },
            { label: user.firstName }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                  {user.phoneNumber && (
                    <div>
                      <p className="text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{user.phoneNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 mb-1">Account Status</p>
                    {getStatusBadge(user.accountStatus)}
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">KYC Status</p>
                    {getKycBadge(user.kycStatus)}
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Email Verified</p>
                    <p className="font-medium text-gray-900">{user.emailVerified ? '✓ Yes' : '✗ No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Member Since</p>
                    <p className="font-medium text-gray-900">{formatDateTime(user.createdAt)}</p>
                  </div>
                  {user.lastLogin && (
                    <div>
                      <p className="text-gray-500 mb-1">Last Login</p>
                      <p className="font-medium text-gray-900">{formatDateTime(user.lastLogin)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Wallet Information */}
            {data.wallet && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-600 mb-1">Balance</p>
                      <p className="font-bold text-gray-900">{formatCurrency(data.wallet.balance)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-600 mb-1">Available</p>
                      <p className="font-bold text-gray-900">{formatCurrency(data.wallet.availableBalance)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600 mb-1">Status</p>
                      <p className="font-bold text-gray-900">{data.wallet.locked ? '🔒 Locked' : '✓ Active'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            {data.recentTransactions && data.recentTransactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTransactions.slice(0, 5).map((tx: any) => (
                        <TableRow key={tx._id}>
                          <TableCell className="capitalize">{tx.type}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                          <TableCell><Badge variant={tx.status === 'completed' ? 'success' : 'warning'}>{tx.status}</Badge></TableCell>
                          <TableCell className="text-gray-600">{formatDateTime(tx.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Active Sessions</span>
                  <span className="font-bold text-gray-900">{data.activeSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Open Tickets</span>
                  <span className="font-bold text-gray-900">{data.openTickets || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.accountStatus === 'locked' ? (
                  <Button 
                    variant="primary" 
                    className="w-full justify-start"
                    onClick={() => handleAction('unlock')}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Account
                  </Button>
                ) : (
                  <Button 
                    variant="danger" 
                    className="w-full justify-start"
                    onClick={() => handleAction('lock')}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Account
                  </Button>
                )}

                {user.accountStatus !== 'suspended' && (
                  <Button 
                    variant="danger" 
                    className="w-full justify-start"
                    onClick={() => handleAction('suspend')}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Account
                  </Button>
                )}

                {data.activeSessions > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAction('forceLogout')}
                    disabled={actionLoading}
                    isLoading={actionLoading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Force Logout All Sessions
                  </Button>
                )}

                <Link href={`/kyc/${userId}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    View KYC Details
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* KYC Info */}
            {data.kyc && (
              <Card>
                <CardHeader>
                  <CardTitle>KYC Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-gray-500 mb-1">Status</p>
                    {getKycBadge(data.kyc.status)}
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Document Type</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {data.kyc.documentType?.replace('-', ' ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Submitted</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(data.kyc.createdAt)}
                    </p>
                  </div>
                  {data.kyc.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-red-700">{data.kyc.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
