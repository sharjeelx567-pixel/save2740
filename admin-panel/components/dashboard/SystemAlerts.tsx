'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import LoadingSpinner from '../ui/LoadingSpinner'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { dashboardService, SystemAlert } from '@/lib/services/dashboard.service'

export default function SystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const data = await dashboardService.getSystemAlerts()
      setAlerts(data)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No system alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'error' ? 'bg-red-50 border-red-500' :
                alert.type === 'warning' ? 'bg-amber-50 border-amber-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  {alert.type === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className={`text-sm font-semibold ${
                    alert.type === 'error' ? 'text-red-900' :
                    alert.type === 'warning' ? 'text-amber-900' :
                    'text-blue-900'
                  }`}>
                    {alert.title}
                  </h4>
                  <p className={`mt-1 text-sm ${
                    alert.type === 'error' ? 'text-red-700' :
                    alert.type === 'warning' ? 'text-amber-700' :
                    'text-blue-700'
                  }`}>
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
