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

      // Fetch trips
      const { data: tripData } = await supabaseClient
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tripData) setTrips(tripData);

      // Fetch shipments
      const { data: shipmentData } = await supabaseClient
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (shipmentData) setShipments(shipmentData);

      // Fetch system metrics via RPC
      const { data: metricsData, error: metricsError } = await supabaseClient.rpc('get_system_metrics');
      if (!metricsError && metricsData) {
        const m = Array.isArray(metricsData) ? metricsData[0] : metricsData;
        setMetrics(m);
      }

      // Calculate Business Metrics
      const { data: requests } = await supabaseClient.from('requests').select('status, weight_tonnes, trip:trips(price_per_tonne), created_at');
      
      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const accepted = requests?.filter(r => r.status === 'accepted') || [];
      const revenue = accepted.reduce((sum, r: any) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0);
      const successRate = requests?.length ? Math.round((accepted.length / requests.length) * 100) : 0;

      setBusinessMetrics({
        total_shipments: shipmentData?.length || 0,
        pending_requests: pending,
        accepted_requests: accepted.length,
        estimated_revenue: revenue,
        success_rate: successRate
      });

      // Populate Historical Events
      const [
        { data: histTrips },
        { data: histShipments },
        { data: histRequests },
        { data: histOffers }
      ] = await Promise.all([
        supabaseClient.from('trips').select('id, origin_city, destination_city, created_at, status').order('created_at', { ascending: false }).limit(5),
        supabaseClient.from('shipments').select('id, origin_city, created_at').order('created_at', { ascending: false }).limit(5),
        supabaseClient.from('requests').select('id, weight_tonnes, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabaseClient.from('shipment_requests').select('id, status, created_at').order('created_at', { ascending: false }).limit(5)
      ]);

      const formattedHist: Event[] = [
        ...(histTrips || []).map(t => ({
          id: `t-${t.id}`,
          type: 'trip' as const,
          message: t.status === 'completed' ? `Trip completed: ${t.origin_city} → ${t.destination_city}` : `New trip: ${t.origin_city} → ${t.destination_city}`,
          time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: t.created_at
        })),
        ...(histShipments || []).map(s => ({
          id: `s-${s.id}`,
          type: 'trip' as const,
          message: `New load posted from ${s.origin_city}`,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: s.created_at
        })),
        ...(histRequests || []).map(r => ({
          id: `r-${r.id}`,
          type: 'booking' as const,
          message: r.status === 'accepted' ? `Booking accepted for ${r.weight_tonnes}t load` : `Booking request: ${r.weight_tonnes}t load`,
          time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: r.created_at
        })),
        ...(histOffers || []).map(o => ({
          id: `o-${o.id}`,
          type: 'booking' as const,
          message: o.status === 'accepted' ? `Offer accepted by shipper` : `New offer sent to shipper`,
          time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: o.created_at
        }))
      ]
      .sort((a, b) => new Date(b.raw_date || '').getTime() - new Date(a.raw_date || '').getTime())
      .slice(0, 15);

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
    
    const channel = supabase
      .channel('admin-monitor-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, (payload) => {
        setEvents(prev => [{
          id: `trip-${Date.now()}`,
          type: 'trip' as const,
          message: `New trip: ${payload.new.origin_city} → ${payload.new.destination_city}`,
          time: 'JUST NOW'
        }, ...prev].slice(0, 15));
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, (payload) => {
        if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
          setEvents(prev => [{
            id: `trip-comp-${Date.now()}`,
            type: 'trip' as const,
            message: `Trip COMPLETED: ${payload.new.origin_city} → ${payload.new.destination_city}`,
            time: 'JUST NOW'
          }, ...prev].slice(0, 15));
        }
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shipments' }, (payload) => {
        setEvents(prev => [{
          id: `shipment-${Date.now()}`,
          type: 'trip' as const,
          message: `New load posted from ${payload.new.origin_city}`,
          time: 'JUST NOW'
        }, ...prev].slice(0, 15));
        fetchData();
      })
      .subscribe();

    const interval = setInterval(fetchData, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-1.5 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Admin Command Center</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium uppercase">System Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Last Sync</p>
            <p className="text-xs font-mono">{lastUpdated.toLocaleTimeString()}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full relative border-b border-slate-800">
              <TripMapComponent trips={trips} shipments={shipments} />
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2 rounded-lg backdrop-blur-sm">
                <MapIcon className="h-4 w-4 text-green-400" />
                <span className="text-xs font-bold uppercase tracking-widest">Logistics Flow</span>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-800" />

          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction="horizontal">
              {/* Block 1: System */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">System</h2>
                  </div>
                  <ScrollArea className="flex-grow">
                    <SystemMetricsPanel metrics={metrics} />
                  </ScrollArea>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-slate-800" />

              {/* Block 2: Business */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Briefcase className="h-4 w-4 text-purple-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business</h2>
                  </div>
                  <ScrollArea className="flex-grow">
                    <BusinessMetricsPanel metrics={businessMetrics} />
                  </ScrollArea>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              {/* Block 3: Console */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col border-r border-slate-800 p-4 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Terminal className="h-4 w-4 text-green-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Console</h2>
                  </div>
                  <LiveEventFeed events={events} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              {/* Block 4: User Activity */}
              <ResizablePanel defaultSize={30} minSize={25}>
                <div className="h-full flex flex-col p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Users</h2>
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono text-[10px]">
                      {users.length} Active
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