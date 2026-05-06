"use client";
import React from 'react';
import { MapPin, TrendingUp } from 'lucide-react';

interface TopRoutesPanelProps {
  routes: { origin: string; destination: string; count: number }[];
}

const TopRoutesPanel: React.FC<TopRoutesPanelProps> = ({ routes }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MapPin className="h-3 w-3 text-orange-400" />
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Top Routes</span>
      </div>
    </div>
    {routes.length === 0 ? (
      <p className="text-[10px] text-slate-500 text-center py-4">No route data</p>
    ) : (
      <div className="space-y-2">
        {routes.slice(0, 5).map((route, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800">
            <span className="text-[10px] font-bold text-slate-300">{route.origin} → {route.destination}</span>
            <span className="text-xs font-mono font-bold text-orange-400">{route.count}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);
export default TopRoutesPanel;