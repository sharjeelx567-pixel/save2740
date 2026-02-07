import { ReactNode } from 'react'
import { Card, CardContent } from '../ui/Card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  format?: 'currency' | 'number' | 'text'
}

export default function StatsCard({ title, value, icon, trend, format = 'text' }: StatsCardProps) {
  const formattedValue =
    format === 'currency' ? formatCurrency(Number(value)) :
      format === 'number' ? formatNumber(Number(value)) :
        value

  return (
    <Card hover>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formattedValue}</p>
            {trend && (
              <div className="mt-2 flex items-center text-sm">
                {trend.isPositive ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
                    <span className="text-emerald-600 font-medium">+{trend.value}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-red-600 font-medium">-{trend.value}%</span>
                  </>
                )}
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-brand-green/10 rounded-lg text-brand-green">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
