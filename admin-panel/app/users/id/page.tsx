'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
    User, Mail, Phone, MapPin, Calendar, Shield, CreditCard,
    Lock, Unlock, Ban, Eye, EyeOff, FileText, History, AlertTriangle
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { usersService } from '@/lib/services/users.service'
import { auditLogsService } from '@/lib/services/audit-logs.service'

export default function UserDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showPII, setShowPII] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            setLoading(true)
            const [userRes, auditRes] = await Promise.all([
                usersService.getUserById(id as string),
                auditLogsService.getUserLogs(id as string)
            ])
            setUser(userRes.data)
            setAuditLogs(auditRes.data.logs || [])
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

            await loadData()
        } catch (err: any) {
            alert(err.message || 'Action failed')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return <AdminLayout><div className="p-6">Loading user profile...</div></AdminLayout>
    if (!user) return <AdminLayout><div className="p-6">User not found</div></AdminLayout>

    return (
        <AdminLayout>
            <PageHeader
                title={`${user.firstName} ${user.lastName}`}
                description={`UID: ${user._id} | Joined ${formatDateTime(user.createdAt)}`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Users', href: '/users' },
                    { label: user.email }
                ]}
            />

            <div className="p-6 space-y-6 animate-fade-in">
                {/* Header Actions */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-4">
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
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowPII(!showPII)}>
                            {showPII ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            {showPII ? 'Mask PII' : 'Reveal PII'}
                        </Button>
                        {user.accountStatus === 'locked' ? (
                            <Button variant="outline" size="sm" className="text-green-600 border-green-200" onClick={() => handleAction('unlock')} disabled={actionLoading}>
                                <Unlock className="w-4 h-4 mr-2" /> Unlock Account
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => handleAction('lock')} disabled={actionLoading}>
                                <Lock className="w-4 h-4 mr-2" /> Lock Account
                            </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleAction('suspend')} disabled={actionLoading || user.accountStatus === 'suspended'}>
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
                                        <p className="text-sm font-medium">{maskString(user.phone || 'Not provided', 5)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Address</p>
                                        <p className="text-sm font-medium">Verified Residential Address</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-lg">Financial Overview</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <div>
                                        <p className="text-xs text-blue-600 font-bold uppercase">Wallet Balance</p>
                                        <p className="text-2xl font-black text-blue-900">{formatCurrency(user.wallet?.balance || 0)}</p>
                                    </div>
                                    <CreditCard className="w-8 h-8 text-blue-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Available</p>
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(user.wallet?.availableBalance || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Locked</p>
                                        <p className="text-sm font-bold text-red-600">{formatCurrency(user.wallet?.locked || 0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Middle: Activity & Audit */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <History className="w-5 h-5" /> Audit Activity Log
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[400px] overflow-y-auto">
                                    {auditLogs.length === 0 ? (
                                        <p className="p-6 text-center text-gray-500 italic">No recent audit logs for this user.</p>
                                    ) : (
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 font-semibold text-gray-700">Action</th>
                                                    <th className="px-6 py-3 font-semibold text-gray-700">Date/Time</th>
                                                    <th className="px-6 py-3 font-semibold text-gray-700">Severity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {auditLogs.map((log: any) => (
                                                    <tr key={log._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</td>
                                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant={log.severity === 'critical' || log.severity === 'error' ? 'danger' : 'info'}>
                                                                {log.severity}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-200">
                            <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-blue-800"><FileText className="w-5 h-5" /> Internal Admin Notes</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0" />
                                        <p className="text-sm text-blue-800 italic">
                                            "User flagged for manual KYC review due to address mismatch. Resolved after supplemental utility bill upload. - Admin Ops, 2024-01-15"
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full py-6 border-dashed">
                                        + Add Internal Note
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
