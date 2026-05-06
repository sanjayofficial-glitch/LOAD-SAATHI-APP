"use client";
import React from 'react';
import { ArrowRight, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface RequestFlowPanelProps {
  pending: number;
  accepted: number;
  completed: number;
  rejected: number;
}

const RequestFlowPanel: React.FC<RequestFlowPanelProps> = ({ pending, accepted, completed, rejected }) => {
  const total = pending + accepted + completed + rejected;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
        <span className="text-slate-500">Pipeline</span>
        <span className="text-slate-400 font-mono">{total} total</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-center p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
          <p className="text-xs font-bold text-yellow-500">{pending}</p>
          <p className="text-[8px] text-slate-500">Pending</p>
        </div>
        <ArrowRight className="h-3 w-3 text-slate-600" />
        <div className="flex-1 text-center p-2 bg-blue-500/20 rounded border border-blue-500/30">
          <p className="text-xs font-bold text-blue-500">{accepted}</p>
          <p className="text-[8px] text-slate-500">Active</p>
        </div>
        <ArrowRight className="h-3 w-3 text-slate-600" />
        <div className="flex-1 text-center p-2 bg-green-500/20 rounded border border-green-500/30">
          <p className="text-xs font-bold text-green-500">{completed}</p>
          <p className="text-[8px] text-slate-500">Done</p>
        </div>
      </div>
    </div>
  );
};
export default RequestFlowPanel;