'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  subtitle?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-brand-green',
  iconBg = 'bg-emerald-50',
}: StatsCardProps) {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-slate-600',
  };

  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-slate-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-600 mb-1">{title}</p>
          <p className="font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          )}
          {change && (
            <p className={`mt-2 font-medium ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${iconBg} p-4 rounded-xl gpu-accelerated`}>
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}
