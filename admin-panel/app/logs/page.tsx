'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { auditLogsService } from '@/lib/services/audit-logs.service';
import { Shield, Loader2, Search, Filter, Terminal, AlertCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function LogsPage() {
  const [resourceType, setResourceType] = useState('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLogs: 0,
    recentLogs: 0,
    criticalLogs: 0,
    errorLogs: 0
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (resourceType !== 'all') params.resourceType = resourceType;
      // Note: search in backend audit-logs might not be implemented fully yet, 
      // but we can filter locally or update backend later.

      const [logsRes, statsRes] = await Promise.all([
        auditLogsService.getLogs(params),
        api.get<{ success: boolean; data: any }>('/api/admin/audit-logs/stats')
      ]);

      if (logsRes.success) setLogs(logsRes.data.logs);
      if (statsRes.success) setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [resourceType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-700 border-red-100';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const filteredLogs = logs.filter(log => {
    const searchStr = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchStr) ||
      log.resourceId?.toLowerCase().includes(searchStr) ||
      log.adminName?.toLowerCase().includes(searchStr) ||
      (log.user && `${log.user.firstName} ${log.user.lastName}`.toLowerCase().includes(searchStr))
    );
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Immutable Audit Trail"
        description="Every administrative action is recorded and stored securely for compliance."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Audit Logs' }
        ]}
      />

      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <Terminal className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Events</p>
                <h3 className="text-3xl font-black text-white">{stats.totalLogs}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Warnings (7d)</p>
                <h3 className="text-3xl font-black text-white">{stats.recentLogs}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-2xl">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Security Anomalies</p>
                <h3 className="text-3xl font-black text-white">0</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                placeholder="Search by action, admin, or resource ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="border rounded-xl px-4 py-2 text-sm font-medium bg-white"
              >
                <option value="all">All Resources</option>
                <option value="user">Users</option>
                <option value="wallet">Wallets</option>
                <option value="group">Groups</option>
                <option value="kyc">KYC Docs</option>
                <option value="config">System Config</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Trail
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200">
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col justify-center items-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-medium">Synthesizing activity trail...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Terminal className="w-12 h-12 mb-2 opacity-20" />
                <p>No activity records match your parameters</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Event Timestamp</TableHead>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Action & Severity</TableHead>
                    <TableHead>Metadata</TableHead>
                    <TableHead>IP Network</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log._id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black">
                            {log.user ? log.user.firstName[0] : 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {log.user ? `${log.user.firstName} ${log.user.lastName}` : (log.adminName || 'System')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`px-2 py-1 rounded-lg border flex items-center gap-2 w-fit ${getSeverityColor(log.severity)}`}>
                          {getSeverityIcon(log.severity)}
                          <span className="text-xs font-black uppercase tracking-tight">{formatAction(log.action)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <p className="font-mono text-slate-400">{log.resourceType}:{log.resourceId?.substring(0, 12)}</p>
                          {log.metadata && (
                            <p className="text-slate-600 truncate max-w-[200px]" title={JSON.stringify(log.metadata)}>
                              {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-400">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
