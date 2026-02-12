"use client"

import { useState, useEffect } from "react"
import { API } from "@/lib/constants"

export interface UsefulLink {
  title: string
  slug: string
  displayOrder?: number
  lastEditedAt?: string
}

export function useUsefulLinks() {
  const [links, setLinks] = useState<UsefulLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API.BASE_URL}/api/useful-links`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.success) return
        setLinks(Array.isArray(data.data) ? data.data : [])
      })
      .catch(() => {
        if (!cancelled) setLinks([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { links, loading }
}
