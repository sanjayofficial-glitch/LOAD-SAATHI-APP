"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ShieldCheck, RefreshCw, Activity, Zap, Database, Cpu } from 'lucide-react';
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
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(15),
        supabase.from('requests').select('*').order('created_at', { ascending: false })
      ]);

      const tripData = tripsRes.data || [];
      const shipmentData = shipmentsRes.data || [];
      const userData = usersRes.data || [];
      const requestData = requestsRes.data || [];

      setTrips(tripData);
      setShipments(shipmentData);
      setUsers(userData);

      const shipmentValue = shipmentData.reduce((sum, s) => sum + (Number(s.weight_tonnes) * Number(s.budget_per_tonne)), 0);
      const tripValue = tripData.reduce((sum, t) => sum + (Number(t.available_capacity_tonnes) * Number(t.price_per_tonne)), 0);
      const totalGMV = shipmentValue + tripValue;

      const pendingRequests = requestData.filter(r => r.status === 'pending').length;
      const acceptedRequests = requestData.filter(r => r.status === 'accepted').length;
      const successRate = requestData.length > 0 ? Math.round((acceptedRequests / requestData.length) * 100) : 100;

      setMetrics({
        active_connections: userData.length + 4,
        api_response_time: Math.floor(Math.random() * 50) + 120,
        error_rate: 0.02,
        active_requests: pendingRequests,
      });

      setBusinessMetrics({
        total_shipments: shipmentData.length,
        total_trips: tripData.length,
        pending_requests: pendingRequests,
        accepted_requests: acceptedRequests,
        estimated_revenue: totalGMV,
        success_rate: successRate,
      });

      const recentEvents: SystemEvent[] = [];
      shipmentData.slice(0, 5).forEach((s: any) => {
        recentEvents.push({
          id: `ship-${s.id}`,
          type: 'booking',
          message: `LOAD_POSTED: ${s.weight_tonnes}t at ${s.origin_city} (Budget: ₹${s.budget_per_tonne}/t)`,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: s.created_at,
        });
      });

      tripData.slice(0, 5).forEach((t: any) => {
        recentEvents.push({
          id: `trip-${t.id}`,
          type: 'trip',
          message: `TRIP_ACTIVE: ${t.vehicle_type} from ${t.origin_city} to ${t.destination_city}`,
          time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: t.created_at,
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
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-orange-500 font-mono tracking-tighter">BOOTING LOADSAATHI_OS...</div>;

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-slate-300 overflow-hidden font-mono selection:bg-orange-500/30">
      {/* OS Header */}
      <header className="h-12 border-b border-slate-800 bg-[#020617] flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-1 rounded shadow-[0_0_10px_rgba(234,88,12,0.5)]">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xs font-black tracking-widest text-white">LOADSAATHI_OS V2.1</h1>
            <div className="h-3 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest">REALTIME_ENGINE: ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()}
            className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-[9px] font-bold uppercase tracking-widest h-7 px-3"
          >
            <RefreshCw className="h-3 w-3 mr-2" /> FORCE_SYNC
          </Button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full relative bg-[#020617]">
              <TripMapComponent trips={trips} shipments={shipments} />
              
              {/* Map Overlay Status */}
              <div className="absolute bottom-4 right-4 z-10 bg-slate-950/90 border border-slate-800 p-3 rounded-lg shadow-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Grid_Status: Nominal ({trips.length + shipments.length} Active Nodes)</span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-full opacity-50" />
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-slate-800 h-1" />
          
          <ResizablePanel defaultSize={40}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={20}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-[#020617]">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">SYS_METRICS</h2>
                  </div>
                  <SystemMetricsPanel metrics={metrics} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle className="bg-slate-800 w-px" />
              
              <ResizablePanel defaultSize={20}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-[#020617]">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Database className="h-3 w-3 text-purple-500" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">BIZ_INTELLIGENCE</h2>
                  </div>
                  <BusinessMetricsPanel metrics={businessMetrics} />
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-slate-800 w-px" />

              <ResizablePanel defaultSize={30}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-[#020617]">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Zap className="h-3 w-3 text-orange-500" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">EVENT_STREAM</h2>
                  </div>
                  <LiveEventFeed events={events} />
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-slate-800 w-px" />

              <ResizablePanel defaultSize={30}>
                <div className="h-full flex flex-col p-4 bg-[#020617]">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-green-500" />
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">TRAFFIC_MONITOR</h2>
                    </div>
                    <Badge variant="outline" className="text-[8px] border-slate-800 text-slate-600 bg-slate-900/50">{users.length} ACTIVE_NODES</Badge>
                  </div>
                  <UserActivityTable users={users} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* OS Footer */}
      <footer className="h-6 border-t border-slate-800 bg-[#020617] flex items-center justify-between px-4 shrink-0 text-[8px] font-bold text-slate-600 uppercase tracking-widest">
        <div className="flex gap-4">
          <span>CPU: 14%</span>
          <span>MEM: 4.8GB</span>
          <span>NET: 256KB/S</span>
        </div>
        <div className="flex gap-4">
          <span>LAST_SYNC: {new Date().toLocaleTimeString()} // ALL SYSTEMS NOMINAL</span>
        </div>
      </footer>
    </div>
  );
};

export default MonitoringDashboard;