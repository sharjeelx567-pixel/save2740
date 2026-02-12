'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
    Activity, Server, Database, ShieldCheck, AlertCircle,
    RefreshCw, Power, PowerOff, ShieldAlert, Cpu, CreditCard
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { api } from '@/lib/api'

export default function SystemDashboard() {
    const [health, setHealth] = useState<any>(null)
    const [config, setConfig] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        loadSystemData()
    }, [])

    const loadSystemData = async () => {
        try {
            setLoading(true)
            const [healthRes, configRes] = await Promise.all([
                api.get('/api/admin/health'),
                api.get('/api/admin/system-config')
            ])
            setHealth(healthRes.data)
            setConfig(configRes.data || [])
        } catch (err) {
            console.error('Failed to load system data:', err)
        } finally {
            setLoading(false)
        }
    }

    const toggleSwitch = async (key: string, currentValue: boolean) => {
        const action = !currentValue ? 'ENABLE' : 'DISABLE'
        if (!confirm(`Are you sure you want to ${action} ${key}? This affects all users immediately.`)) return

        try {
            setActionLoading(key)
            await api.post(`/api/admin/system-config/${key}`, { value: !currentValue })
            await loadSystemData()
        } catch (err: any) {
            alert(err.message || 'Failed to update configuration')
        } finally {
            setActionLoading(null)
        }
    }

    const getSystemStatusBadge = (status: string) => {
        return (
            <Badge variant={status === 'healthy' ? 'success' : 'danger'} className="px-3">
                {status.toUpperCase()}
            </Badge>
        )
    }

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        return `${d}d ${h}h ${m}m`;
    }

    if (loading && !health) return <AdminLayout><div className="p-6">Loading system metrics...</div></AdminLayout>

    return (
        <AdminLayout>
            <PageHeader
                title="System Health & Controls"
                description="Monitor infrastructure status and manage global safety switches."
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'System' }
                ]}
            />

            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white border-blue-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">System Status</p>
                                <div className="mt-1 flex items-center gap-2">
                                    {getSystemStatusBadge(health?.status || 'degraded')}
                                </div>
                            </div>
                            <Server className="w-10 h-10 text-blue-100" />
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-green-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Server Uptime</p>
                                <p className="text-2xl font-black text-gray-900">{formatUptime(health?.uptime || 0)}</p>
                            </div>
                            <Activity className="w-10 h-10 text-green-100" />
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-purple-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Memory Usage</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {Math.round((health?.system?.memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB
                                </p>
                            </div>
                            <Cpu className="w-10 h-10 text-purple-100" />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Global Kill Switches */}
                    <Card className="border-red-100 shadow-lg">
                        <CardHeader className="border-b bg-red-50/50">
                            <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                                <ShieldAlert className="w-5 h-5" /> Global Safety Switches
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[
                                    { key: 'pause_all_payouts', label: 'Pause All Payouts', icon: <PowerOff className="text-red-500" /> },
                                    { key: 'pause_all_contributions', label: 'Pause All Contributions', icon: <AlertCircle className="text-amber-500" /> },
                                    { key: 'maintenance_mode', label: 'Maintenance Mode', icon: <ShieldAlert className="text-red-600" /> }
                                ].map((item) => {
                                    const setting = config.find(c => c.key === item.key);
                                    const isActive = setting?.value === true || setting?.value === 'true';

                                    return (
                                        <div key={item.key} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-lg ${isActive ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{item.label}</p>
                                                    <p className="text-xs text-gray-500">{setting?.description || `Govern ${item.label.toLowerCase()} across the platform.`}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant={isActive ? 'danger' : 'outline'}
                                                onClick={() => toggleSwitch(item.key, isActive)}
                                                disabled={actionLoading === item.key}
                                                size="sm"
                                                className="min-w-[100px]"
                                            >
                                                {isActive ? <PowerOff className="w-4 h-4 mr-1" /> : <Power className="w-4 h-4 mr-1" />}
                                                {isActive ? 'Active' : 'Allow'}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Infrastructure Health */}
                    <Card>
                        <CardHeader className="border-b bg-gray-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" /> Infrastructure Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Database className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium">MongoDB Primary</span>
                                </div>
                                <Badge variant={health?.database?.connected ? 'success' : 'danger'}>
                                    {health?.database?.connected ? 'CONNECTED' : 'DISCONNECTED'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium">Stripe Gateway</span>
                                </div>
                                <Badge variant="success">OPERATIONAL</Badge>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-purple-500" />
                                    <span className="font-medium">Job Processing Queue</span>
                                </div>
                                <Badge variant="success">HEALTHY</Badge>
                            </div>

                            <Button variant="outline" className="w-full mt-4" onClick={loadSystemData}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh Real-time Metrics
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    )
}
