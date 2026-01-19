'use client';

import { useState, useEffect } from 'react';
import { ProtectedPage } from '@/components/protected-page';
import { Save2740Plan } from '@/lib/types/save2740';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';

function Save2740PageContent() {
  const [plans, setPlans] = useState<Save2740Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'completed' | 'paused' | 'all'>('active');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setError(null);
        const response = await fetch('/api/save2740', {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }

        const data = await response.json();

        if (data.success) {
          setPlans(data.data);
        } else {
          setError(data.error || 'Failed to fetch plans');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPlans, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredPlans =
    filter === 'all'
      ? plans
      : plans.filter((plan) => {
          if (filter === 'active') return plan.status === 'active';
          if (filter === 'completed') return plan.status === 'completed';
          if (filter === 'paused') return plan.status === 'paused';
          return true;
        });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-brand-green';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-brand-green';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-green mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your Save2740 plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Save2740 Plans</h1>
              <p className="text-gray-600 mt-1">Create and manage your savings goals</p>
            </div>
            <Link href="/save2740/create">
              <Button className="bg-gradient-to-r from-brand-green to-green-700 gap-2">
                <Plus className="w-4 h-4" />
                New Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['all', 'active', 'paused', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <Card className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans yet</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Create your first Save2740 plan to start saving'
                : `You don't have any ${filter} plans`}
            </p>
            {filter === 'all' && (
              <Link href="/save2740/create">
                <Button className="bg-gradient-to-r from-brand-green to-green-700">
                  Create Your First Plan
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const progressPercent = (plan.currentBalance / plan.totalTargetAmount) * 100;

              return (
                <Link key={plan.id} href={`/save2740/active?id=${plan.id}`}>
                  <Card className="h-full p-6 hover:shadow-lg transition cursor-pointer">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                        <Badge className={`mt-2 ${getStatusColor(plan.status)}`}>
                          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Saved</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-gray-900">
                          ${plan.currentBalance.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">${plan.totalTargetAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(progressPercent)} transition`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {Math.round(progressPercent)}% complete
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-gray-600">Daily Savings</p>
                        <p className="font-bold text-gray-900">
                          ${plan.savingsMode === 'daily' && plan.dailyAmount ? (plan.dailyAmount / 100).toFixed(2) : '$0.00'}
                        </p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-gray-600">Contributions</p>
                        <p className="font-bold text-gray-900">
                          {plan.contributionCount || 0}
                        </p>
                      </div>
                    </div>

                    {/* Auto-fund Badge */}
                    {plan.autoFund && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Badge variant="outline" className="text-xs">
                          Auto-fund enabled
                        </Badge>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Save2740HomePage() {
  return (
    <ProtectedPage>
      <Save2740PageContent />
    </ProtectedPage>
  );
}
