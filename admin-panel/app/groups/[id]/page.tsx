'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { AlertCircle, Snowflake, Flame, Trash2, ArrowLeft, Users, ShieldAlert, History, DollarSign } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { groupsService } from '@/lib/services/groups.service'

export default function GroupDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [group, setGroup] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        loadGroup()
    }, [id])

    const loadGroup = async () => {
        try {
            setLoading(true)
            const response = await groupsService.getGroupById(id as string)
            setGroup(response.data)
        } catch (err: any) {
            console.error('Failed to load group:', err)
            setError(err.message || 'Failed to load group details')
        } finally {
            setLoading(false)
        }
    }

    const handleFreeze = async () => {
        const reason = prompt('Please provide a reason for freezing this group:')
        if (!reason) return

        try {
            setActionLoading(true)
            await groupsService.freezeGroup(id as string, reason)
            await loadGroup()
        } catch (err: any) {
            alert(err.message || 'Failed to freeze group')
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnfreeze = async () => {
        const reason = prompt('Please provide a reason for unfreezing:')
        if (!reason) return

        try {
            setActionLoading(true)
            await groupsService.unfreezeGroup(id as string, reason)
            await loadGroup()
        } catch (err: any) {
            alert(err.message || 'Failed to unfreeze group')
        } finally {
            setActionLoading(false)
        }
    }

    const handleRemoveMember = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name} from this group? This action is auditable.`)) return

        const reason = prompt(`Reason for removing ${name}:`)
        if (!reason) return

        try {
            setActionLoading(true)
            await groupsService.removeMember(id as string, userId, reason)
            await loadGroup()
        } catch (err: any) {
            alert(err.message || 'Failed to remove member')
        } finally {
            setActionLoading(false)
        }
    }

    const handleReinstateMember = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to reinstate ${name}?`)) return

        try {
            setActionLoading(true)
            await groupsService.reinstateMember(id as string, userId)
            await loadGroup()
        } catch (err: any) {
            alert(err.message || 'Failed to reinstate member')
        } finally {
            setActionLoading(false)
        }
    }

    const handleTriggerPayout = async () => {
        try {
            setActionLoading(true)
            // First try normal payout
            await groupsService.triggerPayout(id as string, false)
            await loadGroup()
            alert('Payout triggered successfully')
        } catch (err: any) {
            // If the error is about partial funding, ask to force
            if (err.message && err.message.includes('not fully funded')) {
                const force = confirm('Round not fully funded. Force payout of partial amount?')
                if (force) {
                    try {
                        await groupsService.triggerPayout(id as string, true)
                        await loadGroup()
                        alert('Partial payout triggered successfully')
                    } catch (forceErr: any) {
                        alert(forceErr.message || 'Failed to trigger force payout')
                    }
                }
            } else {
                alert(err.message || 'Failed to trigger payout')
            }
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return <AdminLayout><div className="p-6">Loading group details...</div></AdminLayout>
    if (error || !group) return <AdminLayout><div className="p-6 text-red-600">{error || 'Group not found'}</div></AdminLayout>

    return (
        <AdminLayout>
            <PageHeader
                title={group.name}
                description={`Manage status, members, and ledger for the ${group.name} Osusu group.`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Groups', href: '/groups' },
                    { label: group.joinCode }
                ]}
            />

                <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                    </Button>

                    <div className="flex gap-3">
                        {group.status === 'frozen' ? (
                            <Button variant="outline" className="text-green-600 border-green-200 bg-green-50" onClick={handleUnfreeze} disabled={actionLoading}>
                                <Flame className="w-4 h-4 mr-2" /> Unfreeze Group
                            </Button>
                        ) : (
                            <Button variant="danger" onClick={handleFreeze} disabled={actionLoading || group.status === 'completed'}>
                                <Snowflake className="w-4 h-4 mr-2" /> Freeze Group
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleTriggerPayout} disabled={actionLoading || group.status === 'completed'}>
                            <DollarSign className="w-4 h-4 mr-2" /> Force Payout
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Group Financials & Progress</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Escrow Balance</p>
                                        <p className="text-xl font-black text-blue-600">{formatCurrency(group.escrowBalance)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Paid Out</p>
                                        <p className="text-xl font-black text-green-600">{formatCurrency(group.totalPaidOut)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Contribution</p>
                                        <p className="text-lg font-bold">{formatCurrency(group.contributionAmount)} <span className="text-xs text-gray-500">/{group.frequency}</span></p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Current Round</p>
                                        <p className="text-lg font-bold">{group.currentRound} of {group.totalRounds}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5" /> Membership Details ({group.members.length})
                                </CardTitle>
                                <Badge variant={group.status === 'open' ? 'info' : 'success'}>
                                    {group.status.toUpperCase()}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Position</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Contributed</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.members.map((member: any) => (
                                            <TableRow key={member.userId}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-bold">{member.name}</p>
                                                        <p className="text-xs text-gray-500">{member.email}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>#{member.payoutPosition}</TableCell>
                                                <TableCell>
                                                    <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                                                        {member.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-blue-600">
                                                    {formatCurrency(member.totalContributed)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {member.status === 'removed' || member.status === 'chain_broken' ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-green-500 hover:text-green-700 font-bold"
                                                            onClick={() => handleReinstateMember(member.userId, member.name)}
                                                            disabled={actionLoading}
                                                        >
                                                            Reinstate
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => handleRemoveMember(member.userId, member.name)}
                                                            disabled={actionLoading}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Group Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-gray-500">Target Size</span>
                                    <span className="text-sm font-bold">{group.maxMembers} Members</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-gray-500">Payout Rule</span>
                                    <span className="text-sm font-bold capitalize">{group.payoutOrderRule}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-gray-500">Late Fee</span>
                                    <span className="text-sm font-bold">{group.lateFeePercentage}%</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-sm text-gray-500">Grace Period</span>
                                    <span className="text-sm font-bold">{group.gracePeriodHours}h</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-sm text-gray-500">Chain Break Penalty</span>
                                    <span className="text-sm font-bold text-red-500">{group.chainBreakPenaltyDays} Days</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-200 bg-amber-50">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                                    <ShieldAlert className="w-5 h-5" /> Risk Monitor
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-amber-700">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    {group.chainBreaks.length} Chain breaks detected
                                </div>
                                <div className="flex items-center gap-2 text-sm text-amber-700">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Health Score: {group.chainBreaks.length > 0 ? '75%' : '100%'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Round History / Ledger would go here */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5" /> Contribution Ledger
                        </CardTitle>
                        <Button size="sm" variant="outline">
                            <DollarSign className="w-4 h-4 mr-2" /> Export Ledger
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 italic">Full group rounds and contribution history visualization is coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
