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
import { Search, Eye, Snowflake, ShieldAlert, Users, Calendar } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { groupsService } from '@/lib/services/groups.service'

export default function GroupsPage() {
    const [groups, setGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    })

    useEffect(() => {
        loadGroups()
    }, [page, statusFilter])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1)
            loadGroups()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const loadGroups = async () => {
        try {
            setLoading(true)
            const response = await groupsService.getGroups({
                page,
                limit: 20,
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined
            })
            setGroups(response.data.groups || [])
            setPagination(response.data.pagination)
        } catch (err: any) {
            console.error('Failed to load groups:', err)
            setError(err.message || 'Failed to load groups')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
            active: 'success',
            frozen: 'danger',
            locked: 'warning',
            open: 'info',
            completed: 'success',
            failed: 'danger',
            at_risk: 'warning'
        }
        return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>
    }

    return (
        <AdminLayout>
            <PageHeader
                title="Osusu Groups Control Center"
                description="Monitor and manage all savings groups, contributions, and payouts."
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Groups' }
                ]}
            />

            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total Groups</p>
                                <p className="text-2xl font-bold text-blue-900">{pagination.total}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg text-green-600">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-green-600 font-medium">Active Rounds</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {groups.filter(g => g.status === 'active').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, code or creator..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="open">Open (Recruiting)</option>
                                <option value="locked">Locked</option>
                                <option value="frozen">Frozen</option>
                                <option value="completed">Completed</option>
                                <option value="at_risk">At Risk</option>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        {loading && groups.length === 0 ? (
                            <div className="p-6"><TableSkeleton rows={10} columns={7} /></div>
                        ) : groups.length === 0 ? (
                            <EmptyState
                                icon={<ShieldAlert className="w-12 h-12" />}
                                title="No groups found"
                                description="Try adjusting your filters or search query"
                            />
                        ) : (
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Group Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Amount/Freq</TableHead>
                                            <TableHead>Members</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Round</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groups.map((group) => (
                                            <TableRow key={group._id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{group.name}</p>
                                                        <p className="text-xs font-mono text-blue-600">{group.joinCode}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(group.status)}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium">{formatCurrency(group.contributionAmount)}</p>
                                                        <p className="text-gray-500 capitalize">{group.frequency}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium">{group.currentMembers} / {group.maxMembers}</p>
                                                        <div className="w-24 bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                                            <div
                                                                className="bg-blue-500 h-full"
                                                                style={{ width: `${(group.currentMembers / group.maxMembers) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-bold text-green-600">{formatCurrency(group.escrowBalance)}</p>
                                                        <p className="text-xs text-gray-400">Total: {formatCurrency(group.totalContributed)}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm font-medium">Round {group.currentRound || 0} / {group.totalRounds || 0}</p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/groups/${group._id}`}>
                                                        <Button size="sm" variant="ghost">
                                                            <Eye className="h-4 w-4 mr-1" /> View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="md:hidden space-y-4 p-4">
                            {groups.map((group) => (
                                <div key={group._id} className="border rounded-lg p-4 shadow-sm bg-gray-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{group.name}</p>
                                            <p className="text-xs font-mono text-blue-600">{group.joinCode}</p>
                                        </div>
                                        {getStatusBadge(group.status)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                        <div className="bg-white p-2 rounded border border-gray-100">
                                            <p className="text-xs text-gray-500">Contribution</p>
                                            <p className="font-bold">{formatCurrency(group.contributionAmount)}</p>
                                            <p className="text-xs capitalize text-gray-400">{group.frequency}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded border border-gray-100">
                                            <p className="text-xs text-gray-500">Balance</p>
                                            <p className="font-bold text-green-600">{formatCurrency(group.escrowBalance)}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                        <span>Members: {group.currentMembers}/{group.maxMembers}</span>
                                        <span>Round: {group.currentRound}/{group.totalRounds}</span>
                                    </div>

                                    <Link href={`/groups/${group._id}`} className="block">
                                        <Button size="sm" variant="outline" className="w-full">
                                            <Eye className="h-4 w-4 mr-2" /> View Details
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination logic similar to users page */}
            </div>
        </AdminLayout>
    )
}
