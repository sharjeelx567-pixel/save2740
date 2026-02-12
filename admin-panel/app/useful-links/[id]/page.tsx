'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { usefulLinksService, UsefulLinkItem } from '@/lib/services/useful-links.service'
import { ArrowLeft, Save, History, RotateCcw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const STATUS_OPTIONS = ['draft', 'published', 'archived'] as const

export default function UsefulLinkEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const isNew = id === 'new'

  const [item, setItem] = useState<UsefulLinkItem | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [rollbacking, setRollbacking] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [effectiveDate, setEffectiveDate] = useState('')

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    usefulLinksService.getById(id).then((data) => {
      if (!cancelled) {
        setItem(data)
        setTitle(data.title)
        setSlug(data.slug)
        setContent(data.content || '')
        setEnabled(data.enabled)
        setStatus(data.status)
        setDisplayOrder(data.displayOrder ?? 0)
        setEffectiveDate(data.effectiveDate ? data.effectiveDate.slice(0, 10) : '')
      }
    }).catch(() => {
      if (!cancelled) setItem(null)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [id, isNew])

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      alert('Title and slug are required')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        await usefulLinksService.create({
          title: title.trim(),
          slug: slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          content,
          enabled,
          status,
          displayOrder,
          effectiveDate: effectiveDate || undefined,
        })
        router.push('/useful-links')
        router.refresh()
      } else {
        await usefulLinksService.update(id, {
          title: title.trim(),
          slug: slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          content,
          enabled,
          status,
          displayOrder,
          effectiveDate: effectiveDate || undefined,
        })
        const updated = await usefulLinksService.getById(id)
        setItem(updated)
        setContent(updated.content || '')
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleRollback = async (versionIndex: number) => {
    if (!confirm('Restore this version? Current content will be replaced.')) return
    setRollbacking(versionIndex)
    try {
      await usefulLinksService.rollback(id, versionIndex)
      const updated = await usefulLinksService.getById(id)
      setItem(updated)
      setTitle(updated.title)
      setSlug(updated.slug)
      setContent(updated.content || '')
    } catch (e: any) {
      alert(e.message || 'Rollback failed')
    } finally {
      setRollbacking(null)
    }
  }

  if (!isNew && loading) {
    return (
      <AdminLayout>
        <div className="p-6">Loading...</div>
      </AdminLayout>
    )
  }
  if (!isNew && !item) {
    return (
      <AdminLayout>
        <div className="p-6 text-red-600">Link not found.</div>
        <Button variant="outline" onClick={() => router.push('/useful-links')}>Back to list</Button>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <PageHeader
        title={isNew ? 'New Useful Link' : `Edit: ${item?.title || title}`}
        description={isNew ? 'Create a new policy or footer link.' : 'Update content and visibility. All edits are logged.'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Useful Links', href: '/useful-links' },
          { label: isNew ? 'New' : 'Edit' }
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/useful-links')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Link details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Privacy Policy"
            />
            <Input
              label="Slug (URL path)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. privacy-policy → /privacy-policy"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content (HTML / rich text)</label>
              <textarea
                className="w-full min-h-[280px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-green focus:border-transparent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>Your policy content here. HTML is supported.</p>"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-brand-green"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display order</label>
                <input
                  type="number"
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-brand-green"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                />
                <span className="text-sm text-gray-700">Visible in app (enabled)</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Effective date (optional)</label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!isNew && item && item.versions && item.versions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" /> Version history
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Restore a previous version. Current content will be replaced.</p>
              <ul className="space-y-2">
                {item.versions.map((v, idx) => (
                  <li key={idx} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Version {item.versions.length - idx} — {formatDateTime(v.updatedAt)} by {v.updatedBy || '—'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRollback(idx)}
                      disabled={rollbacking !== null}
                    >
                      {rollbacking === idx ? 'Restoring...' : <><RotateCcw className="w-4 h-4 mr-1" /> Rollback</>}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
