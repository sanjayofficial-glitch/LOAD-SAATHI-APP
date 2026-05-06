"use client";
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, XCircle, Info, Clock } from 'lucide-react';

interface ErrorLogPanelProps {
  logs: { id: string; type: 'error' | 'warning' | 'info'; message: string; time: string }[];
}

const ErrorLogPanel: React.FC<ErrorLogPanelProps> = ({ logs }) => {
  const getIcon = (type: string) => {
    if (type === 'error') return <XCircle className="h-3 w-3 text-red-400" />;
    if (type === 'warning') return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
    return <Info className="h-3 w-3 text-blue-400" />;
  };

  const errorCount = logs.filter(l => l.type === 'error').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Error Log</span>
        </div>
        {errorCount > 0 && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">{errorCount}</span>}
      </div>
      <ScrollArea className="h-[150px] w-full">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-4">No errors</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`p-2 rounded-lg border ${log.type === 'error' ? 'border-red-500/30 bg-red-500/5' : log.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-blue-500/30 bg-blue-500/5'}`}>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{getIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-300 leading-tight">{log.message}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span className="text-[9px] text-slate-500 font-mono">{log.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
export default ErrorLogPanel;