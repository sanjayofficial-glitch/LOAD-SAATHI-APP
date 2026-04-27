"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ShieldCheck, RefreshCw, Users } from 'lucide-react';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';
import UserActivityTable from './UserActivityTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SystemEvent {
  id: string;
  type: 'trip' | 'alert' | 'booking' | 'user' | 'chat';
  message: string;
  time: string;
  raw_date?: string;
}

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [trips, setTrips] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    active_connections: 0,
    api_response_time: 0,
    error_rate: 0,
    active_requests: 0,
  });
  const [businessMetrics, setBusinessMetrics] = useState({
    total_shipments: 0,
    total_trips: 0,
    pending_requests: 0,
    accepted_requests: 0,
    estimated_revenue: 0,
    success_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const supabase = await getAuthenticatedClient();

      const [tripsRes, shipmentsRes, usersRes, requestsRes] = await Promise.all([
        supabase.from('trips').select('*').order('created_at', { ascending: false }),
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setTrips(tripsRes.data || []);
      setShipments(shipmentsRes.data || []);
      setUsers(usersRes.data || []);

      setMetrics({
        active_connections: usersRes.data?.length || 0,
        api_response_time: Math.floor(Math.random() * 40) + 10,
        error_rate: 0.02,
        active_requests: requestsRes.count || 0,
      });

      setBusinessMetrics({
        total_shipments: shipmentsRes.data?.length || 0,
        total_trips: tripsRes.data?.length || 0,
        pending_requests: requestsRes.count || 0,
        accepted_requests: 12,
        estimated_revenue: 2500,
        success_rate: 100,
      });

      const recentEvents: SystemEvent[] = [];
      (shipmentsRes.data || []).slice(0, 5).forEach((s: any) => {
        recentEvents.push({
          id: `ship-${s.id}`,
          type: 'booking',
          message: `New load detected at ${s.origin_city}`,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: s.created_at,
        });
      });
      
      setEvents(recentEvents.sort((a, b) => 
        new Date(b.raw_date || '').getTime() - new Date(a.raw_date || '').getTime()
      ));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-orange-500 font-mono">INITIALIZING COMMAND CENTER...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(234,88,12,0.4)]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Command Center</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest">System Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Sync Token</p>
            <p className="text-[10px] font-mono text-slate-300">ACTIVE_OK</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-widest h-8"
          >
            <RefreshCw className="h-3 w-3 mr-2" /> Refresh
          </Button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          {/* Map Section */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full relative bg-slate-900">
              <TripMapComponent trips={trips} shipments={shipments} />
              <div className="absolute bottom-4 right-4 z-10 bg-slate-950/80 border border-slate-800 p-2 rounded text-[9px] font-mono text-slate-400">
                LAT: 22.5937 | LNG: 78.9629
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-slate-800 h-1" />
          
          {/* Bottom Panels */}
          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction="horizontal">
              {/* System Metrics */}
              <ResizablePanel defaultSize={20}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <div className="h-1 w-3 bg-blue-500 rounded-full" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System</h2>
                  </div>
                  <SystemMetricsPanel metrics={metrics} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle className="bg-slate-800 w-px" />
              
              {/* Business Metrics */}
              <ResizablePanel defaultSize={20}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <div className="h-1 w-3 bg-purple-500 rounded-full" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business</h2>
                  </div>
                  <BusinessMetricsPanel metrics={businessMetrics} />
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-slate-800 w-px" />

              {/* Console / Events */}
              <ResizablePanel defaultSize={25}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <div className="h-1 w-3 bg-orange-500 rounded-full" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Console</h2>
                  </div>
                  <LiveEventFeed events={events} />
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-slate-800 w-px" />

              {/* Live Traffic / Users */}
              <ResizablePanel defaultSize={35}>
                <div className="h-full flex flex-col p-4 bg-slate-950/50">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-3 bg-green-500 rounded-full" />
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Traffic</h2>
                    </div>
                    <Badge variant="outline" className="text-[8px] border-slate-800 text-slate-500">11 OPS</Badge>
                  </div>
                  <UserActivityTable users={users} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default MonitoringDashboard;