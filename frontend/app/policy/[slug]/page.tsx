"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ProtectedPage } from "@/components/protected-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { API } from "@/lib/constants"

interface PolicyData {
  title: string
  slug: string
  content: string
  lastEditedAt?: string
}

function PolicyPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [data, setData] = useState<PolicyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${API.BASE_URL}/api/useful-links/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return
        if (!body?.success) {
          setError(body?.error || "Page not found")
          setData(null)
          return
        }
        setData(body.data)
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load page")
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <p className="text-slate-600">Loading...</p>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
          <p className="text-slate-600 mt-2">{error || "This policy page could not be loaded."}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title={data.title} onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
              <h1 className="hidden lg:block text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                {data.title}
              </h1>
              {data.lastEditedAt && (
                <p className="text-slate-600 text-sm">
                  Last updated: {new Date(data.lastEditedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>

            <Card className="border border-slate-200 shadow-sm rounded-2xl">
              <CardContent className="p-6 md:p-8 prose prose-slate prose-compact max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: data.content || "<p>No content.</p>" }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 border-none">
          <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function PolicyPageWithAuth() {
  return (
    <ProtectedPage>
      <PolicyPage />
    </ProtectedPage>
  )
}
