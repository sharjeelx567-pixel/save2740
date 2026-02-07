'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import Badge from '../ui/Badge'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatDateTime } from '@/lib/utils'
import { dashboardService, Activity } from '@/lib/services/dashboard.service'

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const data = await dashboardService.getRecentActivity()
      setActivities(data)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                  </div>
                  {activity.status && (
                    <Badge variant={
                      activity.status === 'success' ? 'success' :
                      activity.status === 'warning' ? 'warning' : 'danger'
                    }>
                      {activity.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
