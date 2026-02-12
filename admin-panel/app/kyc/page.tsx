'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { kycService } from '@/lib/services/kyc.service'

import StatsCard from '@/components/ui/StatsCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { FilterChips, FilterChip } from '@/components/ui/FilterChips'
import {
  Search,
  Eye,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Timer,
  Filter,
  X,
  FileText
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface KYCRequest {
  id: string
  userId: string
  user: {
    email: string
    firstName: string
    lastName: string
  }
  documentType: string
  status: string
  submittedAt: string
}

export default function AdminKYCPage(): React.ReactElement {
  const router = useRouter()
  const [requests, setRequests] = useState<KYCRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })

  useEffect(() => {
    fetchKYCRequests()
  }, [filter, search, page])

  const fetchKYCRequests = async () => {
    try {
      setLoading(true)
      const result = await kycService.getKYCList({
        status: filter,
        search: search.trim() || undefined,
        page,
        limit: 50
      })
      setRequests(Array.isArray(result.data) ? result.data : [])
      if (result.pagination) setPagination(result.pagination)
    } catch (err) {
      console.error(err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const getSLA = (submittedAt: string) => {
    const hours = (Date.now() - new Date(submittedAt).getTime()) / 3600000
    if (hours > 48) return { label: 'CRITICAL (48h+)', color: 'text-red-600', bg: 'bg-red-50' }
    if (hours > 24) return { label: 'URGENT (24h+)', color: 'text-amber-600', bg: 'bg-amber-50' }
    return { label: 'NORMAL', color: 'text-green-600', bg: 'bg-green-50' }
  }

  const activeFilterChips: FilterChip[] = []
  if (filter !== 'all') activeFilterChips.push({ key: 'status', label: 'Status', value: filter })
  if (search.trim()) activeFilterChips.push({ key: 'search', label: 'Search', value: search.trim() })

  const removeFilter = (key: string) => {
    if (key === 'status') setFilter('all')
    if (key === 'search') setSearch('')
    setPage(1)
  }
  const resetFilters = () => {
    setFilter('pending')
    setSearch('')
    setPage(1)
  }

  const filtered = requests

  const criticalCount = requests.filter(r => (Date.now() - new Date(r.submittedAt).getTime()) / 3600000 > 48).length
  const urgentCount = requests.filter(r => {
    const h = (Date.now() - new Date(r.submittedAt).getTime()) / 3600000
    return h > 24 && h <= 48
  }).length
  const withinSlaCount = requests.filter(r => (Date.now() - new Date(r.submittedAt).getTime()) / 3600000 <= 24).length

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-full min-w-0">
      {/* Page Header - same style as Dashboard */}
      <div className="min-w-0">
        <h1 className="font-bold text-slate-900 text-xl sm:text-2xl truncate">KYC Compliance Queue</h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">Verify user identities and maintain platform security.</p>
      </div>

      {/* Stats Grid - responsive: 1 col mobile, 2 tablet, 4 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Critical SLA (48h+)"
          value={criticalCount}
          icon={Timer}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatsCard
          title="Urgent SLA (24h+)"
          value={urgentCount}
          icon={Timer}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Within SLA"
          value={withinSlaCount}
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Total Queue"
          value={requests.length}
          icon={FileText}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      {/* Search + Filter - same card style as Dashboard */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 card-hover min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-4 md:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px] touch-manipulation"
            aria-expanded={filtersOpen}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterChips.length > 0 && (
              <span className="bg-brand-green text-white text-xs rounded-full px-2 py-0.5">{activeFilterChips.length}</span>
            )}
          </button>
          {activeFilterChips.length > 0 && (
            <button type="button" onClick={resetFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900">
              <X className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
        <div className={`flex flex-col sm:flex-row gap-3 items-stretch sm:items-center ${filtersOpen ? 'flex' : 'hidden'} md:flex w-full min-w-0`}>
          <div className="relative w-full min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              className="w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-base"
              placeholder="Search name or email"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search KYC by name or email"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap bg-slate-100 p-1 rounded-lg overflow-x-auto gap-1 min-w-0">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f as any); setPage(1); }}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-1.5 text-xs sm:text-sm rounded-md font-medium min-h-[44px] touch-manipulation transition-colors whitespace-nowrap ${filter === f ? 'bg-white shadow text-brand-green' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchKYCRequests} className="sm:ml-auto w-full sm:w-auto min-h-[44px] touch-manipulation" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {activeFilterChips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <FilterChips chips={activeFilterChips} onRemove={removeFilter} onReset={resetFilters} />
          </div>
        )}
      </div>

      {/* KYC Requests Table - desktop only; cards on tablet/mobile */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 card-hover overflow-hidden min-w-0">
        <div className="hidden md:block overflow-x-auto admin-table-wrap -mx-2 sm:mx-0">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="hidden xl:table-cell">Document</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map(r => {
                const sla = getSLA(r.submittedAt)
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{r.user.firstName} {r.user.lastName}</p>
                      <p className="text-xs text-slate-500">{r.user.email}</p>
                    </TableCell>

                    <TableCell>
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${sla.bg} ${sla.color}`}>
                        <AlertTriangle className="inline w-3 h-3 mr-1" />
                        {sla.label}
                      </span>
                    </TableCell>

                    <TableCell className="hidden xl:table-cell capitalize text-slate-600">
                      {r.documentType.replace('-', ' ')}
                    </TableCell>

                    <TableCell className="text-sm text-slate-500">
                      {formatDateTime(r.submittedAt)}
                    </TableCell>

                    <TableCell>
                      <Badge variant={r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}>
                        {r.status.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => router.push(`/kyc/${r.userId}`)}>
                        <Eye className="w-4 h-4 mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* MOBILE/TABLET CARDS - show when table is hidden (below md) */}
        <div className="md:hidden space-y-4">
          {filtered.map(r => {
            const sla = getSLA(r.submittedAt)
            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 card-hover">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{r.user.firstName} {r.user.lastName}</p>
                    <p className="text-sm text-slate-500">{r.user.email}</p>
                  </div>
                  <Badge variant="warning">{r.status.toUpperCase()}</Badge>
                </div>

                <div className={`p-2 text-xs font-bold rounded-lg mt-3 ${sla.bg} ${sla.color}`}>
                  SLA: {sla.label}
                </div>

                <Button className="w-full h-11 mt-4" onClick={() => router.push(`/kyc/${r.userId}`)}>
                  <Eye className="w-4 h-4 mr-2" /> Review Application
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 min-w-0">
          <p className="text-sm text-slate-600 order-2 sm:order-1 text-center sm:text-left">
            Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span> ({pagination.total} total)
          </p>
          <div className="flex gap-2 order-1 sm:order-2 justify-center sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="min-h-[44px] touch-manipulation flex-1 sm:flex-none">
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages || loading} className="min-h-[44px] touch-manipulation flex-1 sm:flex-none">
              Next
            </Button>
          </div>
        </div>
      )}

    </div>

  )
}
