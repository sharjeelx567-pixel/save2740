import { ReactNode } from 'react'
import Breadcrumbs from './Breadcrumbs'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  action?: ReactNode
}

export default function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-4 sm:py-4">
      {breadcrumbs && (
        <div className="mb-2 sm:mb-3 overflow-x-auto">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 sm:ml-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
