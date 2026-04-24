"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ArrowRight, Activity } from 'lucide-react';

interface GeoTrendsProps {
  trends: {
    popularRoutes: any[];
    stateActivity: Record<string, { demand: number; supply: number }>;
  };
}

const GeographicTrendsPanel: React.FC<GeoTrendsProps> = ({ trends }) => {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Popular Routes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {trends.popularRoutes.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">No route data available</div>
            ) : (
              trends.popularRoutes.map((route, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-300">{route.origin}</span>
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    <span className="text-slate-300">{route.destination}</span>
                  </div>
                  <div className="text-xs font-bold text-orange-500">{route.count} Active</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Regional Activity (Top States)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[200px] overflow-y-auto scrollbar-hide">
            <table className="w-full text-xs">
              <thead className="bg-slate-950 sticky top-0">
                <tr>
                  <th className="text-left p-3 text-slate-500 font-medium">State</th>
                  <th className="text-center p-3 text-slate-500 font-medium">Demand</th>
                  <th className="text-center p-3 text-slate-500 font-medium">Supply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.entries(trends.stateActivity)
                  .sort((a, b) => (b[1].demand + b[1].supply) - (a[1].demand + a[1].supply))
                  .slice(0, 5)
                  .map(([state, data]) => (
                    <tr key={state} className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium">{state}</td>
                      <td className="p-3 text-center text-blue-400">{data.demand}</td>
                      <td className="p-3 text-center text-orange-400">{data.supply}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeographicTrendsPanel;