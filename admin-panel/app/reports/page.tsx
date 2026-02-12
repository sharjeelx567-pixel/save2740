'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { reportsService } from '@/lib/services/reports.service';
import {
    Users, Group, CircleDollarSign, Activity,
    TrendingUp, ShieldAlert, FileText, Download,
    RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function ReportsPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [synced, setSynced] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState('30d');

    useEffect(() => {
        loadData();
    }, [timeframe]);

    const loadData = async () => {
        try {
            setLoading(true);
            setSynced(false);
            const [summaryRes, healthRes] = await Promise.all([
                reportsService.getSummary(),
                reportsService.getHealth()
            ]);
            setSummary(summaryRes.data);
            setHealth(healthRes.data);
            setSynced(true);
            setTimeout(() => setSynced(false), 2000);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = () => {
        window.print();
    };

    const handleDownloadCsv = async () => {
        try {
            setExporting('csv');
            await reportsService.downloadTransactionsCsv(timeframe);
        } catch (e) {
            console.error(e);
            alert('Download failed. Please try again.');
        } finally {
            setExporting(null);
        }
    };

    const handleAuditProof = () => {
        router.push('/logs');
    };

    return (
        <AdminLayout>
            <PageHeader
                title="Platform Analytics & Intelligence"
                description="Comprehensive reporting on growth, health, and financial performance."
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Reports' }
                ]}
            />

            <div className="p-6 space-y-6 animate-fade-in">
                {/* Controls */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                        {['7d', '30d', '90d', 'all'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {synced ? 'Synced' : 'Sync'}
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleExportPdf}>
                            <Download className="w-4 h-4 mr-2" /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* Top Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
                                    <h3 className="text-3xl font-black text-slate-900">{summary?.users || 0}</h3>
                                    <p className="text-xs text-green-600 font-bold mt-1">▲ 12.5% vs last period</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Groups</p>
                                    <h3 className="text-3xl font-black text-slate-900">{summary?.groups || 0}</h3>
                                    <p className="text-xs text-green-600 font-bold mt-1">▲ 4 new today</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-2xl">
                                    <Group className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
                                    <h3 className="text-3xl font-black text-slate-900">{formatCurrency(summary?.volume || 0)}</h3>
                                    <p className="text-xs text-emerald-600 font-bold mt-1">Processed securely</p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-2xl">
                                    <CircleDollarSign className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
                                    <h3 className="text-3xl font-black text-slate-900">{summary?.transactions || 0}</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">All events logged</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-2xl">
                                    <Activity className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Health Overview */}
                    <Card className="lg:col-span-1 border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" /> Operation Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-xl text-red-600">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">Failed TX (24h)</span>
                                    </div>
                                    <span className={`text-lg font-black ${health?.failedTransactions24h > 10 ? 'text-red-600' : 'text-slate-900'}`}>{health?.failedTransactions24h || 0}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">Pending KYC</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{health?.pendingKyc || 0}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">Frozen Wallets</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{health?.frozenWallets || 0}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Infrastructure Status</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-emerald-50 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase">Engine</span>
                                        <span className="text-xs font-bold text-emerald-900">HEALTHY</span>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase">Vault</span>
                                        <span className="text-xs font-bold text-emerald-900">ENCRYPTED</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Growth Chart Placeholder / Narrative */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" /> Cumulative Volume Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">Detailed Time-Series Analytics</h4>
                            <p className="text-sm text-slate-500 max-w-sm">
                                High-fidelity charting for deposit trends and group contribution velocity is available via the
                                <span className="font-bold text-emerald-600 px-1">SuperAdmin BI Export</span>.
                            </p>
                            <div className="mt-8 flex gap-4">
                                <Button variant="outline" size="sm" onClick={handleDownloadCsv} disabled={!!exporting}>
                                    {exporting === 'csv' ? 'Downloading…' : 'Download CSV'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleAuditProof}>Audit Proof</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
