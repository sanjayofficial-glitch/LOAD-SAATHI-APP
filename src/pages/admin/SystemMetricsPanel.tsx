"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity, Server, ShieldCheck, Zap } from 'lucide-react';

const SystemMetricsPanel: React.FC<{ metrics: any }> = ({ metrics }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 text-white h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-500" /> System Health
        </CardTitle>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold">API Latency</p>
            <div className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              {metrics.api_response_time}ms
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Error Rate</p>
            <div className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {metrics.error_rate}%
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Connections</span>
            </div>
            <span className="text-sm font-bold text-blue-400">{metrics.active_connections}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Pending Requests</span>
            </div>
            <span className="text-sm font-bold text-orange-400">{metrics.total_pending_requests}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
            <span>Database Status</span>
            <span className="text-emerald-500">Operational</span>
          </div>
          <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemMetricsPanel;