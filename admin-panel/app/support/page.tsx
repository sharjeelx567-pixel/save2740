'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { MessageSquare, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
    total: 0
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api/admin/support-tickets/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.data)
      }

      // Fetch Tickets
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const ticketsRes = await fetch(`http://localhost:5000/api/admin/support-tickets${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const ticketsData = await ticketsRes.json()
      if (ticketsData.success) {
        setTickets(ticketsData.data.tickets)
      }
    } catch (error) {
      console.error('Failed to fetch support data:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <AdminLayout>
      <div className="flex justify-between items-start mb-6">
        <PageHeader
          title="Support Tickets"
          description="Manage customer support requests"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Support' }
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} className="gap-2">
            <Clock className="w-4 h-4" />
            Refresh
          </Button>
          <Link href="/support/live-chat">
            <Button variant="primary" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Open Live Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">{stats.open}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">{stats.inProgress}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent Priority</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600">{stats.urgent}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
                <option value="all">All Tickets</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tickets found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell className="font-mono text-xs">{ticket.ticketNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {ticket.user?.firstName} {ticket.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{ticket.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate" title={ticket.subject}>{ticket.subject}</p>
                        <p className="text-xs text-gray-500">{ticket.category}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          ticket.status === 'open' ? 'danger' :
                            ticket.status === 'in-progress' ? 'warning' : 'success'
                        }>
                          {ticket.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          ticket.priority === 'urgent' ? 'danger' :
                            ticket.priority === 'high' ? 'danger' :
                              ticket.priority === 'medium' ? 'warning' : 'info'
                        }>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {ticket.assignedAdmin ? `${ticket.assignedAdmin.firstName} ${ticket.assignedAdmin.lastName}` : 'Unassigned'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(ticket.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/support/${ticket._id}`}>
                          <Button size="sm" variant="primary">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
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
