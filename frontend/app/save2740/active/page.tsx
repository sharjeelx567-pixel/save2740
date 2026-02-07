'use client';

import { Suspense } from 'react';
import { useSave2740Plan } from '@/hooks/use-save2740-plan';
import { ActivePlanScreen } from '@/components/save2740/active-plan-screen';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ActivePlanContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('id') || '';

  const { plan, loading, error, refetch } = useSave2740Plan(planId);

  if (!planId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
        <Card className="max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Plan Not Found</h2>
          <p className="text-gray-600 text-center mb-4">
            No plan ID was provided. Please select a plan from your dashboard.
          </p>
          <Link href="/save2740" className="block">
            <Button className="w-full">Back to Plans</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
        <Card className="max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error Loading Plan</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => refetch()}>
              Retry
            </Button>
            <Link href="/save2740" className="flex-1">
              <Button className="w-full">Back</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
        <Card className="max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Plan Not Found</h2>
          <p className="text-gray-600 text-center mb-4">
            The plan you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/save2740" className="block">
            <Button className="w-full">Back to Plans</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/save2740" className="text-brand-green hover:text-brand-green/90 font-medium">
            ← Back to Plans
          </Link>
          <button
            onClick={() => refetch()}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Active Plan Screen */}
        <ActivePlanScreen planId={planId} onPlanUpdated={refetch} />
      </div>
    </div>
  );
}

export default function ActiveSave2740Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    }>
      <ActivePlanContent />
    </Suspense>
  );
}

