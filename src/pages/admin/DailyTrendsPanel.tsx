"use client";
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Users, Truck, Package, IndianRupee } from 'lucide-react';

interface TrendData {
  today: number; yesterday: number; label: string; icon: 'users' | 'trips' | 'shipments' | 'revenue';
}

interface DailyTrendsPanelProps {
  trends: TrendData[];
}

const DailyTrendsPanel: React.FC<DailyTrendsPanelProps> = ({ trends }) => {
  const getTrend = (today: number, yesterday: number) => {
    if (yesterday === 0) return { direction: 'up', pct: 100 };
    const diff = today - yesterday;
    const pct = Math.round((Math.abs(diff) / yesterday) * 100);
    return diff > 0 ? { direction: 'up', pct } : diff < 0 ? { direction: 'down', pct } : { direction: 'same', pct: 0 };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-3 w-3 text-green-400" />
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Daily Trends</span>
      </div>
      <div className="space-y-2">
        {trends.map((trend) => {
          const { direction, pct } = getTrend(trend.today, trend.yesterday);
          const colorClass = direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-slate-400';
          return (
            <div key={trend.label} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">{trend.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-slate-200">{trend.today}</span>
                <span className={`text-[9px] font-mono font-bold ${colorClass}`}>
                  {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'} {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DailyTrendsPanel;