"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Package, TrendingUp, IndianRupee, BarChart3 } from 'lucide-react';

interface BusinessMetricsProps {
  metrics: {
    totalShipments: number;
    matchedShipments: number;
    pendingRequests: number;
    estimatedRevenue: number;
    capacityUtilization: number;
  };
}

const BusinessMetricsPanel: React.FC<BusinessMetricsProps> = ({ metrics }) => {
  const matchRate = metrics.totalShipments > 0 
    ? (metrics.matchedShipments / metrics.totalShipments) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Package className="h-4 w-4" /> Shipment Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-2">
            <div className="text-2xl font-bold">{metrics.matchedShipments} / {metrics.totalShipments}</div>
            <div className="text-xs text-emerald-400 font-medium">{matchRate.toFixed(1)}% Match Rate</div>
          </div>
          <Progress value={matchRate} className="h-1.5 bg-slate-800" />
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Capacity Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-2">
            <div className="text-2xl font-bold">{metrics.capacityUtilization.toFixed(1)}%</div>
            <div className="text-xs text-blue-400 font-medium">Active Fleet</div>
          </div>
          <Progress value={metrics.capacityUtilization} className="h-1.5 bg-slate-800" />
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <IndianRupee className="h-4 w-4" /> Est. Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">
            ₹{metrics.estimatedRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">From completed shipments</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">
            {metrics.pendingRequests}
          </div>
          <p className="text-xs text-slate-500 mt-1">Awaiting user action</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessMetricsPanel;