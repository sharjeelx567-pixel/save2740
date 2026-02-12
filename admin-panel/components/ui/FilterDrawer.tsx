'use client'

import { ReactNode, useEffect } from 'react'
import { X, Filter } from 'lucide-react'
import Button from './Button'
import { cn } from '@/lib/utils'

interface FilterDrawerProps {
    isOpen: boolean
    onClose: () => void
    onReset?: () => void
    title?: string
    children: ReactNode
    activeFilterCount?: number
}

export default function FilterDrawer({
    isOpen,
    onClose,
    onReset,
    title = 'Filters',
    children,
    activeFilterCount = 0
}: FilterDrawerProps) {
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="filter-drawer-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-700" />
                        <h2 id="filter-drawer-title" className="text-lg font-semibold text-gray-900">
                            {title}
                        </h2>
                        {activeFilterCount > 0 && (
                            <span className="bg-brand-green text-white text-xs rounded-full px-2 py-0.5 font-medium">
                                {activeFilterCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        aria-label="Close filters"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {children}
                </div>

                {/* Footer - Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                    {onReset && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                onReset()
                                onClose()
                            }}
                            className="w-full"
                        >
                            Reset All Filters
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        onClick={onClose}
                        className="w-full"
                    >
                        Apply Filters
                    </Button>
                </div>
            </div>
        </>
    )
}

// Mobile Filter Toggle Button Component
interface FilterToggleButtonProps {
    onClick: () => void
    activeCount?: number
    className?: string
}

export function FilterToggleButton({ onClick, activeCount = 0, className }: FilterToggleButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm md:hidden",
                className
            )}
            aria-label="Open filters"
        >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeCount > 0 && (
                <span className="bg-brand-green text-white text-xs rounded-full px-2 py-0.5 font-medium ml-auto">
                    {activeCount}
                </span>
            )}
        </button>
    )
}
