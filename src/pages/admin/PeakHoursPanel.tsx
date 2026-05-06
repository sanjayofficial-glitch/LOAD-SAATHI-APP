"use client";
import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';

interface PeakHoursPanelProps {
  hourlyData: { hour: number; count: number }[];
}

const PeakHoursPanel: React.FC<PeakHoursPanelProps> = ({ hourlyData }) => {
  const maxCount = Math.max(...hourlyData.map(h => h.count), 1);
  const peakHour = hourlyData.reduce((max, h) => h.count > max.count ? h : max, { hour: 0, count: 0 });
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] text-slate-400 uppercase font-bold">Peak Hours</span>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
        <p className="text-lg font-mono font-bold text-orange-400">{peakHour.hour}:00</p>
        <p className="text-[9px] text-slate-500">Peak hour</p>
      </div>
    </div>
  );
};
export default PeakHoursPanel;