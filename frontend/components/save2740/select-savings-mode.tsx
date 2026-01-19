'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar } from 'lucide-react';

interface SelectSavingsModeProps {
  planName: string;
  targetAmount: number;
  onSelect: (mode: 'daily' | 'weekly') => void;
}

export function SelectSavingsMode({ planName, targetAmount, onSelect }: SelectSavingsModeProps) {
  const dailyAmount = (targetAmount / 365).toFixed(2);
  const weeklyAmount = (targetAmount / 52).toFixed(2);
  const monthlyEquivalent = (targetAmount / 12).toFixed(2);
  const timelineDays = Math.ceil(targetAmount / parseFloat(dailyAmount));

  return (
    <Card className="w-full max-w-md p-6">
      <h3 className="text-xl font-bold mb-2">Select Savings Mode</h3>
      <p className="text-sm text-gray-600 mb-4">How often would you like to contribute?</p>

      <div className="space-y-3 mb-4">
        {/* Daily Option */}
        <button
          onClick={() => onSelect('daily')}
          className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-lg">Daily Savings</h4>
            <Badge className="bg-green-100 text-green-800">Recommended</Badge>
          </div>
          <p className="text-2xl font-bold text-blue-600 mb-3">${dailyAmount}/day</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <p className="text-xs text-gray-500">Weekly Equivalent</p>
              <p className="font-semibold">${(parseFloat(dailyAmount) * 7).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Timeline</p>
              <p className="font-semibold">~1 year</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Monthly Target</p>
              <p className="font-semibold">${monthlyEquivalent}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Per Month</p>
              <p className="font-semibold text-green-600">~$30</p>
            </div>
          </div>
          <Alert className="mt-3 bg-green-50 border-green-200">
            <AlertCircle className="h-3 w-3 text-green-600" />
            <AlertDescription className="text-xs text-green-700">
              Best for building consistent habits and maintaining streaks
            </AlertDescription>
          </Alert>
        </button>

        {/* Weekly Option */}
        <button
          onClick={() => onSelect('weekly')}
          className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-lg">Weekly Savings</h4>
            <Badge variant="outline">Flexible</Badge>
          </div>
          <p className="text-2xl font-bold text-purple-600 mb-3">${weeklyAmount}/week</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <p className="text-xs text-gray-500">Monthly Equivalent</p>
              <p className="font-semibold">${(parseFloat(weeklyAmount) * 4.33).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Timeline</p>
              <p className="font-semibold">~1 year</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Bi-weekly</p>
              <p className="font-semibold">${(parseFloat(weeklyAmount) * 2).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Year</p>
              <p className="font-semibold text-purple-600">~${targetAmount}</p>
            </div>
          </div>
          <Alert className="mt-3 bg-purple-50 border-purple-200">
            <AlertCircle className="h-3 w-3 text-purple-600" />
            <AlertDescription className="text-xs text-purple-700">
              Perfect for paycheck-aligned savings schedules
            </AlertDescription>
          </Alert>
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-semibold mb-2">📊 Plan Summary</p>
        <p className="text-gray-600">
          <strong>{planName}</strong>
          <br />
          Target: <strong className="text-green-600">${targetAmount.toFixed(2)}</strong>
        </p>
      </div>
    </Card>
  );
}
