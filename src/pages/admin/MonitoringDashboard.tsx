"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import {
  Activity,
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
import UserActivityTable from './UserActivityTable';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';

interface Event {
  id: string;
  type: 'trip' | 'booking' | 'user' | 'chat' | 'alert';
  message: string;
  time: string;
}

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [users, setUsers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState({
    active_connections: 0,
    api_response_time: 0,
    error_rate: 0,
    active_requests: 0
  });
  const [businessMetrics, setBusinessMetrics] = useState({
    tripsCount: 0,
    shipmentsCount: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    estimatedRevenue: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);

  const addEvent = useCallback((type: Event['type'], message: string) => {
    const newEvent: Event = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const supabaseClient = await getAuthenticatedClient();

      // Fetch trips with proper joins
      const { data: tripsData, error: tripsError } = await supabaseClient
        .from('trips')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (tripsError) {
        console.error('[Trips Error]', tripsError);
      } else {
        setTrips(tripsData || []);
        if (tripsData && tripsData.length > 0) {
          addEvent('trip', `Live: ${tripsData.length} active trucker trips`);
        }
      }

      // Fetch shipments
      const { data: shipmentsData, error: shipmentsError } = await supabaseClient
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (shipmentsError) {
        console.error('[Shipments Error]', shipmentsError);
      } else {
        setShipments(shipmentsData || []);
        if (shipmentsData && shipmentsData.length > 0) {
          addEvent('booking', `Live: ${shipmentsData.length} available loads`);
        }
      }

      // Fetch users
      const { data: userData } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setUsers(userData || []);

      // Fetch metrics
      try {
        const { data: metricsData } = await supabaseClient.rpc('get_system_metrics');
        if (metricsData) {
          const m = Array.isArray(metricsData) ? metricsData[0] : metricsData;
          setMetrics({
            active_connections: m.active_connections || 0,
            api_response_time: m.api_response_time || 0,
            error_rate: m.error_rate || 0,
            active_requests: m.active_requests || 0
          });
        }
      } catch (e) {
        console.log('Metrics RPC not available, using defaults');
      }

      // Calculate business metrics
      const { data: requests } = await supabaseClient
        .from('requests')
        .select('status');

      const { data: offers } = await supabaseClient
        .from('shipment_requests')
        .select('status');

      const totalAccepted = (requests || []).filter((r: any) => r.status === 'accepted').length + 
                           (offers || []).filter((o: any) => o.status === 'accepted').length;
      const totalRequests = (requests || []).length + (offers || []).length;

      setBusinessMetrics({
        tripsCount: tripsData?.length || 0,
        shipmentsCount: shipmentsData?.length || 0,
        pendingRequests: (requests || []).filter((r: any) => r.status === 'pending').length,
        acceptedRequests: totalAccepted,
        estimatedRevenue: totalAccepted * 5000,
        successRate: totalRequests ? Math.round((totalAccepted / totalRequests) * 100) : 0
      });

    } catch (err) {
      console.error('[Monitoring] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient, addEvent]);

  useEffect(() => {
    fetchAllData();

    // Set up real-time subscriptions
    const tripsChannel = supabase
      .channel('admin-trips-realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'trips' }, 
        (payload) => {
          addEvent('trip', `New: ${payload.new.origin_city} → ${payload.new.destination_city}`);
          fetchAllData();
        }
      )
      .subscribe();

    const shipmentsChannel = supabase
      .channel('admin-shipments-realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'shipments' }, 
        (payload) => {
          addEvent('booking', `New load: ${payload.new.origin_city} → ${payload.new.destination_city}`);
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripsChannel);
      supabase.removeChannel(shipmentsChannel);
    };
  }, [fetchAllData, addEvent]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-300 font-bold">
        <RefreshCw className="h-8 w-8 animate-spin mr-2 text-orange-500" /> 
        <span className="tracking-widest uppercase text-xs">Loading Command Center...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-2 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100">Command Center</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500/80 font-medium uppercase tracking-wider">System Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Token:</span>
            <span className="text-xs font-mono text-blue-400">ACTIVE</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchAllData()} 
            className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs h-9 px-3"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={55} minSize={40}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50}>
                <div className="h-full relative bg-slate-900/50 border-r border-slate-800/30">
                  <TripMapComponent items={trips} type="trip" color="#f97316" />
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-2.5 rounded-lg">
                    <div className="bg-orange-500/20 p-1.5 rounded-md">
                      <Truck className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trucker Network</span>
                      <span className="text-sm font-bold text-orange-400">{businessMetrics.tripsCount} Active</span>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="w-1 bg-slate-800/50" />
              <ResizablePanel defaultSize={50}>
                <div className="h-full relative bg-slate-900/50">
                  <TripMapComponent items={shipments} type="shipment" color="#3b82f6" />
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 p-2.5 rounded-lg">
                    <div className="bg-blue-500/20 p-1.5 rounded-md">
                      <Package className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shipper Network</span>
                      <span className="text-sm font-bold text-blue-400">{businessMetrics.shipmentsCount} Loads</span>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="h-1 bg-slate-800/50" />

          <ResizablePanel defaultSize={45}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={22}>
                <div className="h-full flex flex-col border-r border-slate-800/30 bg-slate-900/30 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Health</h2>
                  </div>
                  <ScrollArea className="flex-grow -mr-2 pr-2">
                    <SystemMetricsPanel metrics={metrics} />
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="w-1 bg-slate-800/50" />
              <ResizablePanel defaultSize={22}>
                <div className="h-full flex flex-col border-r border-slate-800/30 bg-slate-900/30 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-4 w-4 text-purple-400" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business Ops</h2>
                  </div>
                  <ScrollArea className="flex-grow -mr-2 pr-2">
                    <BusinessMetricsPanel {...businessMetrics} />
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="w-1 bg-slate-800/50" />
              <ResizablePanel defaultSize={28}>
                <div className="h-full flex flex-col border-r border-slate-800/30 bg-slate-900/30 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal className="h-4 w-4 text-green-400" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Console</h2>
                  </div>
                  <LiveEventFeed events={events} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="w-1 bg-slate-800/50" />
              <ResizablePanel defaultSize={28}>
                <div className="h-full flex flex-col bg-slate-900/30 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-4 w-4 text-orange-400" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User Traffic</h2>
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