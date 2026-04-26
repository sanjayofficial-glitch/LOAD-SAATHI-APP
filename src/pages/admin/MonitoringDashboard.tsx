"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCw } from 'lucide-react';

interface Event {
  id: string;
  type: 'trip' | 'booking' | 'user' | 'chat' | 'alert';
  message: string;
  time: string;
}

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState({
    active_connections: 0,
    api_response_time: 0,
    error_rate: 0,
    active_requests: 0
  });

  const fetchData = useCallback(async () => {
    try {
      const supabaseClient = await getAuthenticatedClient();

      // Simple metrics fetch
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_system_metrics');
      
      if (!metricsError && metricsData) {
        setMetrics(metricsData);
      }

      // Live events subscription
      const channel = supabase
        .channel('admin-live-feed')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications' }, 
          (payload) => {
            const msg = payload.new.message;
            const type = payload.new.type as Event['type'] || 'alert';
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setEvents(prev => [{ id: payload.new.id, type, message: msg, time } as Event, ...prev].slice(0, 10));
          }
        )
        .subscribe();

      setLoading(false);
    } catch (err) {
      console.error('[Monitoring] Error:', err);
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
        <span className="text-white text-sm font-medium tracking-wider">Loading Command Center...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded">
            <span className="text-white">⚡</span>
          </div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">Command Center</h1>
        </div>
      </header>

      <main className="flex-grow overflow-hidden px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="rounded bg-slate-800 p-3 flex items-center gap-2">
              <span className="text-blue-300 h-5 w-5 flex items-center justify-center">📊</span>
              <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">Active Connections</span>
              <span className="text-lg font-bold text-slate-100">{metrics.active_connections}</span>
            </div>
            <div className="rounded bg-slate-800 p-3 flex items-center gap-2">
              <span className="text-blue-300 h-5 w-5 flex items-center justify-center">⏱️</span>
              <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">API Latency</span>
              <span className="text-lg font-bold text-slate-100">{metrics.api_response_time}ms</span>
            </div>
            <div className="rounded bg-slate-800 p-3 flex items-center gap-2">
              <span className="text-red-300 h-5 w-5 flex items-center justify-center">⚠️</span>
              <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">Error Rate</span>
              <span className="text-lg font-bold text-slate-100">{metrics.error_rate}%</span>
            </div>
          </div>

          <div className="rounded bg-slate-800 p-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-300 h-5 w-5 flex items-center justify-center">📡</span>
              <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">Live Feed</span>
            </div>
            <ScrollArea className="h-40 border-t border-slate-700/50 mt-2">
              {events.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-sm">No live events</div>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="flex gap-2 text-[9px] text-slate-300 group">
                    <span className="flex items-center gap-1">
                      <span className={`text-${e.type === 'trip' ? 'orange' : e.type === 'booking' ? 'green' : e.type === 'user' ? 'blue' : 'red'} 500`}>
                        {e.type === 'trip' ? '🚚' : e.type === 'booking' ? '✅' : e.type === 'user' ? '👤' : '⚠️'}
                      </span>
                      <span className="flex-1 truncate">{e.message}</span>
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">{e.time}</span>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MonitoringDashboard;