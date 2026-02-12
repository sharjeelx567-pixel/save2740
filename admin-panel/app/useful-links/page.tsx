'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
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
import { usefulLinksService, UsefulLinkItem } from '@/lib/services/useful-links.service'
import { Edit, Plus, RefreshCw, Link2, Eye, EyeOff } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const statusVariant = (s: string) =>
  s === 'published' ? 'success' : s === 'archived' ? 'default' : 'warning'

export default function UsefulLinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<UsefulLinkItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const data = await usefulLinksService.list()
      setLinks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const toggleEnabled = async (item: UsefulLinkItem) => {
    try {
      await usefulLinksService.patch(item._id, { enabled: !item.enabled })
      await fetchLinks()
    } catch (e: any) {
      alert(e.message || 'Failed to update')
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Useful Links (CMS)"
        description="Manage policy pages and footer links. Changes apply immediately when published."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Useful Links' }]}
        action={
          <Button size="sm" onClick={() => router.push('/useful-links/new')}>
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </Button>
        }
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 justify-between">
            <p className="text-sm text-gray-600">
              Only <strong>Published</strong> and <strong>Enabled</strong> links appear in the app footer. Edit content and use version history for compliance.
            </p>
            <Button variant="outline" size="sm" onClick={fetchLinks} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>

        {/* Desktop table */}
        <Card className="hidden lg:block overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Last edited</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : links.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No links yet. Add one or run the seed script to create default policy links.
                    </TableCell>
                  </TableRow>
                ) : (
                  links.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">/{item.slug}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleEnabled(item)}
                          className="text-gray-500 hover:text-gray-700"
                          title={item.enabled ? 'Hide from app' : 'Show in app'}
                        >
                          {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </TableCell>
                      <TableCell>{item.displayOrder}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {item.lastEditedAt ? formatDateTime(item.lastEditedAt) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/useful-links/${item._id}`)}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <Card><CardContent className="p-6 text-center text-gray-500">Loading...</CardContent></Card>
          ) : links.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-gray-500">No links yet.</CardContent></Card>
          ) : (
            links.map((item) => (
              <Card key={item._id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-gray-500 font-mono">/{item.slug}</p>
                    </div>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => toggleEnabled(item)}
                      className="text-gray-500"
                    >
                      {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <Button size="sm" className="w-full max-w-[120px]" onClick={() => router.push(`/useful-links/${item._id}`)}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
