"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Package, TrendingUp } from 'lucide-react';

interface BusinessMetricsProps {
  metrics: {
    total_shipments: number;
    total_trips: number;
    pending_requests: number;
    accepted_requests: number;
    estimated_revenue: number;
    success_rate: number;
  };
}

const BusinessMetricsPanel: React.FC<BusinessMetricsProps> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-900/50 border-slate-800 shadow-inner group hover:border-cyan-500/30 transition-colors">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Truck className="h-3 w-3 text-cyan-400" />
              <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
            </div>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">LIVE_TRIPS</p>
            <p className="text-xl font-mono font-bold text-slate-100">{metrics.total_trips}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 shadow-inner group hover:border-orange-500/30 transition-colors">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-3 w-3 text-orange-400" />
              <div className="h-1 w-1 rounded-full bg-orange-500 animate-pulse" />
            </div>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">ACTIVE_LOADS</p>
            <p className="text-xl font-mono font-bold text-slate-100">{metrics.total_shipments}</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-800 space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">CONVERSION_RATE</p>
          <p className="text-xs font-mono font-bold text-green-500">{metrics.success_rate}%</p>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div 
            className="bg-green-500 h-full transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
            style={{ width: `${metrics.success_rate}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessMetricsPanel;