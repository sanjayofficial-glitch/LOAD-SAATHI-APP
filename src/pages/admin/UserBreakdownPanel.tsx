"use client";
import React from 'react';
import { Users, Truck, Package, UserPlus, UserCheck } from 'lucide-react';

interface UserBreakdownPanelProps {
  totalUsers: number; truckers: number; shippers: number; newUsersToday: number; verifiedUsers: number;
}

const UserBreakdownPanel: React.FC<UserBreakdownPanelProps> = ({ totalUsers, truckers, shippers, newUsersToday, verifiedUsers }) => {
  const truckerPct = totalUsers > 0 ? Math.round((truckers / totalUsers) * 100) : 0;
  const shipperPct = totalUsers > 0 ? Math.round((shippers / totalUsers) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">User Breakdown</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20 text-center">
          <Truck className="h-4 w-4 text-orange-400 mx-auto mb-1" />
          <p className="text-lg font-mono font-bold text-orange-400">{truckers}</p>
          <p className="text-[8px] text-slate-500">Truckers ({truckerPct}%)</p>
        </div>
        <div className="flex-1 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center">
          <Package className="h-4 w-4 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-mono font-bold text-blue-400">{shippers}</p>
          <p className="text-[8px] text-slate-500">Shippers ({shipperPct}%)</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800">
          <UserPlus className="h-3 w-3 text-green-400" />
          <span className="text-[9px] text-slate-400">New: {newUsersToday}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-800">
          <UserCheck className="h-3 w-3 text-purple-400" />
          <span className="text-[9px] text-slate-400">Verified: {verifiedUsers}</span>
        </div>
      </div>
    </div>
  );
};
export default UserBreakdownPanel;