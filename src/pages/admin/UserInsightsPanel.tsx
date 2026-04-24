"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Award, Truck } from 'lucide-react';

interface UserInsightsProps {
  insights: {
    truckerCount: number;
    shipperCount: number;
    newToday: number;
    topUsers: any[];
  };
}

const UserInsightsPanel: React.FC<UserInsightsProps> = ({ insights }) => {
  const total = insights.truckerCount + insights.shipperCount;
  const truckerPercent = total > 0 ? (insights.truckerCount / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Users className="h-4 w-4" /> User Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-400">Truckers ({insights.truckerCount})</span>
                <span className="text-blue-400">Shippers ({insights.shipperCount})</span>
              </div>
              <div className="h-2 w-full bg-blue-500 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-orange-500" 
                  style={{ width: `${truckerPercent}%` }}
                />
              </div>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg text-center min-w-[80px]">
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <UserPlus className="h-3 w-3" /> New
              </div>
              <div className="text-lg font-bold text-emerald-400">+{insights.newToday}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Award className="h-4 w-4" /> Top Active Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {insights.topUsers.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.full_name || 'Anonymous'}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{user.user_type}</div>
                  </div>
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-400">
                  {user.total_trips || 0} Trips
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInsightsPanel;