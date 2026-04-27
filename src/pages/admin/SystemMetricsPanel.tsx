"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Zap, Activity } from 'lucide-react';

interface MetricsProps {
  metrics: {
    active_connections: number;
    api_response_time: number;
    error_rate: number;
    active_requests: number;
  };
}

const SystemMetricsPanel: React.FC<MetricsProps> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-3 w-3 text-slate-500" />
              <Activity className="h-3 w-3 text-green-500" />
            </div>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">CONNECTIONS</p>
            <p className="text-xl font-mono font-bold text-slate-100">{metrics.active_connections}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-[8px] font-mono text-slate-600">ms</span>
            </div>
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">LATENCY</p>
            <p className="text-xl font-mono font-bold text-slate-100">{metrics.api_response_time}</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">API_TRAFFIC_FLOW</p>
          <Zap className="h-2 w-2 text-blue-500 animate-pulse" />
        </div>
        <div className="h-8 flex items-end gap-0.5">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="flex-1 bg-blue-500/20 rounded-t-sm" 
              style={{ height: `${Math.random() * 100}%` }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMetricsPanel;