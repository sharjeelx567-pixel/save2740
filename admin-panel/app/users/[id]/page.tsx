'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  User, Mail, Phone, MapPin, Calendar, Shield, CreditCard,
  Lock, Unlock, Ban, Eye, EyeOff, FileText, History, AlertTriangle,
  ArrowLeft, LogOut, Snowflake, Flame
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { usersService } from '@/lib/services/users.service'
import { auditLogsService } from '@/lib/services/audit-logs.service'
import Link from 'next/link'

export default function UserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPII, setShowPII] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const userIdStr = id as string
      const [userRes, auditRes] = await Promise.all([
        usersService.getUserById(userIdStr),
        auditLogsService.getUserLogs(userIdStr)
      ])
      setData(userRes.data)
      setAuditLogs(auditRes.data.logs || auditRes.data || [])
    } catch (err) {
      console.error('Failed to load user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const maskString = (str: string, visibleCount: number = 4) => {
    if (!str || showPII) return str
    return str.substring(0, visibleCount) + '*'.repeat(Math.max(0, str.length - visibleCount))
  }

  const handleAction = async (action: string) => {
    const reason = prompt(`Please provide a reason for ${action}:`)
    if (!reason) return

    try {
      setActionLoading(true)
      if (action === 'lock') await usersService.lockUser(id as string, reason)
      else if (action === 'unlock') await usersService.unlockUser(id as string)
      else if (action === 'suspend') await usersService.suspendUser(id as string, reason)
      else if (action === 'forceLogout') await usersService.forceLogout(id as string)
      else if (action === 'freezeWallet') await usersService.freezeWallet(id as string, reason)
      else if (action === 'unfreezeWallet') await usersService.unfreezeWallet(id as string, reason)

      await loadData()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    try {
      setActionLoading(true)
      await usersService.addNote(id as string, noteText)
      setNoteText('')
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to add note')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <AdminLayout><div className="p-6">Loading user profile...</div></AdminLayout>
  if (!data) return <AdminLayout><div className="p-6">User not found</div></AdminLayout>

  const user = data.user || data
  const wallet = data.wallet

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <Link href="/users" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>

        <PageHeader
          title={`${user.firstName} ${user.lastName}`}
          description={`UID: ${user._id} | Joined ${formatDateTime(user.createdAt)}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Users', href: '/users' },
            { label: user.email }
          ]}
        />

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center bg-white p-4 rounded-xl border shadow-sm gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <Badge variant={user.accountStatus === 'active' ? 'success' : 'danger'} className="px-3 py-1">
              {user.accountStatus.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" /> KYC:
              <Badge variant={user.kycStatus === 'approved' ? 'success' : 'warning'}>
                {user.kycStatus}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setShowPII(!showPII)} className="flex-1 sm:flex-none">
              {showPII ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPII ? 'Mask PII' : 'Reveal PII'}
            </Button>

            {user.accountStatus === 'locked' ? (
              <Button variant="outline" size="sm" className="text-green-600 border-green-200 flex-1 sm:flex-none" onClick={() => handleAction('unlock')} disabled={actionLoading}>
                <Unlock className="w-4 h-4 mr-2" /> Unlock Account
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 flex-1 sm:flex-none" onClick={() => handleAction('lock')} disabled={actionLoading}>
                <Lock className="w-4 h-4 mr-2" /> Lock Account
              </Button>
            )}

            {wallet?.status === 'frozen' ? (
              <Button variant="outline" size="sm" className="text-green-600 border-green-200 flex-1 sm:flex-none" onClick={() => handleAction('unfreezeWallet')} disabled={actionLoading}>
                <Flame className="w-4 h-4 mr-2" /> Unfreeze Wallet
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 flex-1 sm:flex-none" onClick={() => handleAction('freezeWallet')} disabled={actionLoading}>
                <Snowflake className="w-4 h-4 mr-2" /> Freeze Wallet
              </Button>
            )}

            <Button variant="danger" size="sm" onClick={() => handleAction('suspend')} disabled={actionLoading || user.accountStatus === 'suspended'} className="flex-1 sm:flex-none">
              <Ban className="w-4 h-4 mr-2" /> Suspend
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User Details */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader><CardTitle className="text-lg">Identity & Contact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Email Address</p>
                      <p className="text-sm font-medium">{maskString(user.email, 3)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Phone Number</p>
                      <p className="text-sm font-medium">{maskString(user.phoneNumber || 'Not provided', 5)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Residential Address</p>
                      <p className="text-sm font-medium">
                        {user.address?.street ? `${user.address.street}, ${user.address.city}` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Financial Overview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex justify-between items-center p-4 rounded-xl border ${wallet?.status === 'frozen' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <div>
                    <p className={`text-xs font-bold uppercase ${wallet?.status === 'frozen' ? 'text-red-500' : 'text-blue-600'}`}>
                      {wallet?.status === 'frozen' ? 'Wallet Frozen' : 'Wallet Balance'}
                    </p>
                    <p className="text-2xl font-black text-blue-900">{formatCurrency(wallet?.balance || 0)}</p>
                  </div>
                  <CreditCard className={`w-8 h-8 ${wallet?.status === 'frozen' ? 'text-red-300' : 'text-blue-300'}`} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 font-bold uppercase">Available</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(wallet?.availableBalance || 0)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 font-bold uppercase">Locked (Groups)</p>
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(wallet?.escrowBalance || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle & Right: Activity & Audit */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" /> Audit Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto">
                  {!auditLogs || auditLogs.length === 0 ? (
                    <p className="p-6 text-center text-gray-500 italic">No recent audit logs for this user.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Severity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.slice(0, 50).map((log: any) => (
                          <TableRow key={log._id}>
                            <TableCell className="font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</TableCell>
                            <TableCell className="text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant={log.severity === 'critical' || log.severity === 'error' ? 'danger' : log.severity === 'warning' ? 'warning' : 'info'}>
                                {log.severity}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-blue-800"><FileText className="w-5 h-5" /> Internal Admin Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {user.adminNotes && user.adminNotes.length > 0 ? (
                    user.adminNotes.map((note: any, idx: number) => (
                      <div key={idx} className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-sm text-blue-900">{note.note}</p>
                          <p className="text-xs text-blue-500 mt-1">
                            Added by {note.adminName} on {formatDateTime(note.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 italic py-4">No internal notes yet.</p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"
                    placeholder="Add a new internal note (auditable)..."
                  />
                  <Button
                    className="mt-2 w-full"
                    onClick={handleAddNote}
                    disabled={actionLoading || !noteText.trim()}
                  >
                    Add Internal Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
