"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Globe, 
  AlertTriangle, 
  Cpu,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MetricsProps {
  metrics: {
    active_connections: number;
    api_response_time: number;
    error_rate: number;
    active_requests: number;
  };
}

const SystemMetricsPanel: React.FC<MetricsProps> = ({ metrics }) => {
  // Mocking some health percentages based on metrics
  const connectionHealth = Math.min(100, (metrics.active_connections / 100) * 100);
  const latencyHealth = Math.max(0, 100 - (metrics.api_response_time / 5));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-3 w-3 text-blue-400" />
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Connections</p>
            <p className="text-lg font-mono font-bold text-slate-100">{metrics.active_connections}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span className="text-[10px] font-mono text-slate-500">ms</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Latency</p>
            <p className="text-lg font-mono font-bold text-slate-100">{metrics.api_response_time}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 mt-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Cpu className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">API Load</span>
            </div>
            <span className="text-[10px] font-mono text-slate-300">{connectionHealth.toFixed(0)}%</span>
          </div>
          <Progress value={connectionHealth} className="h-1 bg-slate-800" />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-[10px] text-slate-400 uppercase font-bold">Error Rate</span>
            </div>
            <span className="text-[10px] font-mono text-red-400">{metrics.error_rate}%</span>
          </div>
          <Progress value={metrics.error_rate * 10} className="h-1 bg-slate-800" />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold">Database Status</span>
          </div>
          <span className="text-[10px] font-mono text-green-400">OPTIMAL</span>
        </div>
      </div>
    </div>
  );
};

export default SystemMetricsPanel;