'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterChip {
  key: string
  label: string
  value: string
}

interface FilterChipsProps {
  chips: FilterChip[]
  onRemove: (key: string) => void
  onReset: () => void
  className?: string
}

export function FilterChips({ chips, onRemove, onReset, className }: FilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green border border-brand-green/20"
        >
          <span className="truncate max-w-[120px] sm:max-w-[180px]" title={`${chip.label}: ${chip.value}`}>
            {chip.label}: {chip.value}
          </span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="p-0.5 rounded hover:bg-brand-green/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            aria-label={`Remove filter ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-gray-600 hover:text-gray-900 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded"
      >
        Reset all
      </button>
    </div>
  )
}
