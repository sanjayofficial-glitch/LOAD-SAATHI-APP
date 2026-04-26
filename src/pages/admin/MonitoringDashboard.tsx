"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabaseClient';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { 
  Activity, 
  Map as MapIcon, 
  BarChart3, 
  RefreshCw, 
  ShieldCheck,
  Briefcase,
  Terminal,
  Truck,
  Package,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserActivityTable from './UserActivityTable';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Event {
  id: string;
  type: 'trip' | 'booking' | 'user' | 'chat' | 'alert';
  message: string;
  time: string;
  raw_date?: string;
}

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState({ 
    active_connections: 0, 
    api_response_time: 0, 
    error_rate: 0,
    active_requests: 0 
  });
  const [businessMetrics, setBusinessMetrics] = useState({
    total_shipments: 0,
    total_trips: 0,
    pending_requests: 0,
    accepted_requests: 0,
    estimated_revenue: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const supabaseClient = await getAuthenticatedClient();

      // Fetch active users
      const { data: userData } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (userData) setUsers(userData);

      // Fetch trips with trucker info
      const { data: tripData } = await supabaseClient
        .from('trips')
        .select('*, trucker:users!trips_trucker_id_fkey(full_name)')
        .order('created_at', { ascending: false });
      
      if (tripData) setTrips(tripData);

      // Fetch shipments with shipper info
      const { data: shipmentData } = await supabaseClient
        .from('shipments')
        .select('*, shipper:users!shipments_shipper_id_fkey(full_name)')
        .order('created_at', { ascending: false });
      
      if (shipmentData) setShipments(shipmentData);

      // Fetch system metrics
      const { data: metricsData, error: metricsError } = await supabaseClient.rpc('get_system_metrics');
      if (!metricsError && metricsData) {
        const m = Array.isArray(metricsData) ? metricsData[0] : metricsData;
        setMetrics(m);
      }

      // Calculate Business Metrics
      const { data: requests } = await supabaseClient.from('requests').select('status, weight_tonnes, trip:trips(price_per_tonne)');
      
      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const accepted = requests?.filter(r => r.status === 'accepted') || [];
      const revenue = accepted.reduce((sum, r: any) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0);
      const successRate = requests?.length ? Math.round((accepted.length / requests.length) * 100) : 0;

      setBusinessMetrics({
        total_shipments: shipmentData?.length || 0,
        total_trips: tripData?.length || 0,
        pending_requests: pending,
        accepted_requests: accepted.length,
        estimated_revenue: revenue,
        success_rate: successRate
      });

      // Historical events
      const [{ data: hTrips }, { data: hShips }] = await Promise.all([
        supabaseClient.from('trips').select('id, origin_city, destination_city, created_at').limit(3),
        supabaseClient.from('shipments').select('id, origin_city, created_at').limit(3)
      ]);

      const formattedHist: Event[] = [
        ...(hTrips || []).map(t => ({
          id: `t-${t.id}`,
          type: 'trip' as const,
          message: `Trip activity: ${t.origin_city} → ${t.destination_city}`,
          time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: t.created_at
        })),
        ...(hShips || []).map(s => ({
          id: `s-${s.id}`,
          type: 'trip' as const,
          message: `New load detected at ${s.origin_city}`,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: s.created_at
        }))
      ]
      .sort((a, b) => new Date(b.raw_date || '').getTime() - new Date(a.raw_date || '').getTime());

      setEvents(formattedHist);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Monitoring] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(234,88,12,0.4)]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase">Command Center</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block border-r border-slate-800 pr-4 mr-2">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Sync Token</p>
            <p className="text-[11px] font-mono text-slate-300">ACTIVE_OK</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-widest"
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full relative bg-slate-900">
              <TripMapComponent trips={trips} shipments={shipments} />
              
              {/* Map Title Overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-lg backdrop-blur-md shadow-2xl">
                <MapIcon className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Global Logistics Flow</span>
              </div>

              {/* Map Counters Overlay */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div className="flex items-center gap-2 bg-slate-950/80 border border-orange-500/30 p-2 rounded-lg backdrop-blur-md shadow-2xl">
                  <Truck className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-mono font-bold text-orange-500">{trips.length}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">TRIPS</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/80 border border-blue-500/30 p-2 rounded-lg backdrop-blur-md shadow-2xl">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-mono font-bold text-blue-500">{shipments.length}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">LOADS</span>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-800" />

          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System</h2>
                  </div>
                  <ScrollArea className="flex-grow">
                    <SystemMetricsPanel metrics={metrics} />
                  </ScrollArea>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Briefcase className="h-4 w-4 text-purple-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business</h2>
                  </div>
                  <ScrollArea className="flex-grow">
                    <BusinessMetricsPanel metrics={businessMetrics} />
                  </ScrollArea>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Terminal className="h-4 w-4 text-green-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Console</h2>
                  </div>
                  <LiveEventFeed events={events} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={30} minSize={25}>
                <div className="h-full flex flex-col p-4 bg-slate-950/50">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Traffic</h2>
                    </div>
                    <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-500 font-mono text-[9px] px-1.5 py-0">
                      {users.length} OPS
                    </Badge>
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