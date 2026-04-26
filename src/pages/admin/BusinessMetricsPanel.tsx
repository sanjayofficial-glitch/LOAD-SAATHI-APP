"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  IndianRupee,
  ArrowUpRight
} from 'lucide-react';

interface BusinessMetricsProps {
  metrics: {
    total_shipments: number;
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
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-3 w-3 text-orange-400" />
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Loads</p>
            <p className="text-lg font-mono font-bold text-slate-100">{metrics.total_shipments}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <IndianRupee className="h-3 w-3 text-green-400" />
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Est. GMV</p>
            <p className="text-lg font-mono font-bold text-slate-100">
              ₹{(metrics.estimated_revenue / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Booking Success Rate</p>
            <p className="text-2xl font-mono font-bold text-blue-400">{metrics.success_rate}%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Accepted</p>
            <p className="text-sm font-mono font-bold text-slate-300">{metrics.accepted_requests}</p>
          </div>
        </div>
        
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-500 h-full transition-all duration-1000" 
            style={{ width: `${metrics.success_rate}%` }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-2.5 bg-slate-900/30 rounded-lg border border-slate-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold">Active Requests</span>
          </div>
          <span className="text-xs font-mono text-slate-200">{metrics.pending_requests}</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessMetricsPanel;