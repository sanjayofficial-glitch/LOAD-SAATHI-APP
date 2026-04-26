"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Package, Truck, CheckCircle2, ArrowUpRight, AlertCircle } from 'lucide-react';

interface BusinessMetricsProps {
  tripsCount: number;
  shipmentsCount: number;
  pendingRequests: number;
  acceptedRequests: number;
  estimatedRevenue: number;
  successRate: number;
}

const BusinessMetricsPanel: React.FC<BusinessMetricsProps> = ({
  tripsCount,
  shipmentsCount,
  pendingRequests,
  acceptedRequests,
  estimatedRevenue,
  successRate
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-900 border-slate-800 shadow-inner">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Total Trips</p>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-500" />
                <p className="text-2xl font-mono font-bold text-orange-400">{tripsCount}</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-orange-600/60" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-inner">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Total Loads</p>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <p className="text-2xl font-mono font-bold text-blue-400">{shipmentsCount}</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-blue-600/60" />
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Booking Conversion</p>
            <p className="text-2xl font-mono font-bold text-green-400">{successRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">GMV Estimator</p>
            <p className="text-sm font-mono font-bold text-slate-300">₹{(estimatedRevenue / 1000).toFixed(1)}k</p>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex mt-3">
          <div
            className="bg-green-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            style={{ width: `${successRate}%` }}
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
          <span className="text-xs font-mono text-slate-200">{pendingRequests}</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessMetricsPanel;