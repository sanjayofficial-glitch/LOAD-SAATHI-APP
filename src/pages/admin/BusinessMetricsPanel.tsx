"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  IndianRupee,
  ArrowUpRight,
  Truck
} from 'lucide-react';

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
        <Card className="bg-slate-900 border-slate-800 shadow-inner">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Truck className="h-3 w-3 text-orange-400" />
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            </div>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Total Trips</p>
            <p className="text-lg font-mono font-bold text-slate-100">{metrics.total_trips}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-inner">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-3 w-3 text-blue-400" />
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            </div>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Total Loads</p>
            <p className="text-lg font-mono font-bold text-slate-100">{metrics.total_shipments}</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Booking Conversion</p>
            <p className="text-2xl font-mono font-bold text-green-400">{metrics.success_rate}%</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">GMV Estimator</p>
            <p className="text-sm font-mono font-bold text-slate-300">₹{(metrics.estimated_revenue / 1000).toFixed(1)}k</p>
          </div>
        </div>
        
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
          <div 
            className="bg-green-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
            style={{ width: `${metrics.success_rate}%` }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-800/50 group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-md bg-slate-800 text-purple-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Active Requests</span>
          </div>
          <span className="text-xs font-mono text-slate-200">{metrics.pending_requests}</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessMetricsPanel;