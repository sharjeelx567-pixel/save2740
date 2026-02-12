'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Column {
    key: string
    label: string
    className?: string
    mobileLabel?: string
    render?: (value: any, row: any) => ReactNode
}

interface ResponsiveTableProps {
    columns: Column[]
    data: any[]
    keyField?: string
    onRowClick?: (row: any) => void
    className?: string
    emptyMessage?: string
    loading?: boolean
}

export default function ResponsiveTable({
    columns,
    data,
    keyField = 'id',
    onRowClick,
    className,
    emptyMessage = 'No data available',
    loading = false
}: ResponsiveTableProps) {
    if (loading) {
        return (
            <div className="w-full">
                {/* Desktop skeleton */}
                <div className="hidden md:block animate-pulse">
                    <div className="h-12 bg-gray-200 rounded mb-2" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded mb-1" />
                    ))}
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-gray-500">
                <p>{emptyMessage}</p>
            </div>
        )
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className={cn("min-w-full divide-y divide-gray-200", className)}>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(
                                        "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                        column.className
                                    )}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, rowIndex) => (
                            <tr
                                key={row[keyField] || rowIndex}
                                onClick={() => onRowClick?.(row)}
                                className={cn(
                                    "hover:bg-gray-50 transition-colors",
                                    onRowClick && "cursor-pointer"
                                )}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(
                                            "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
                                            column.className
                                        )}
                                    >
                                        {column.render
                                            ? column.render(row[column.key], row)
                                            : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {data.map((row, rowIndex) => (
                    <div
                        key={row[keyField] || rowIndex}
                        onClick={() => onRowClick?.(row)}
                        className={cn(
                            "bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3",
                            onRowClick && "cursor-pointer active:bg-gray-50"
                        )}
                    >
                        {columns.map((column) => {
                            const value = column.render
                                ? column.render(row[column.key], row)
                                : row[column.key]

                            // Skip if value is empty/null
                            if (value === null || value === undefined || value === '') return null

                            return (
                                <div key={column.key} className="flex justify-between items-start gap-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                                        {column.mobileLabel || column.label}
                                    </span>
                                    <span className="text-sm text-gray-900 text-right flex-1">
                                        {value}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </>
    )
}
