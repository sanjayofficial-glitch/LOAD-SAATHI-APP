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
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserActivityTable from './UserActivityTable';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';
import { ScrollArea } from '@/components/ui/scroll-area';

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [events, setEvents] = useState([]);
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

      // Fetch system metrics via RPC
      const { data: metricsData, error: metricsError } = await supabaseClient.rpc('get_system_metrics');
      if (!metricsError && metricsData) {
        const m = Array.isArray(metricsData) ? metricsData[0] : metricsData;
        setMetrics(m);
      }

      // Calculate Business Metrics
      const { data: shipments } = await supabaseClient.from('shipments').select('id, origin_city, created_at');
      const { data: requests } = await supabaseClient.from('requests').select('status, weight_tonnes, trip:trips(price_per_tonne), created_at');
      
      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const accepted = requests?.filter(r => r.status === 'accepted') || [];
      const revenue = accepted.reduce((sum, r: any) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0);
      const successRate = requests?.length ? Math.round((accepted.length / requests.length) * 100) : 0;

      setBusinessMetrics({
        total_shipments: shipments?.length || 0,
        pending_requests: pending,
        accepted_requests: accepted.length,
        estimated_revenue: revenue,
        success_rate: successRate
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Monitoring] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions for immediate visual feedback
    const channel = supabase
      .channel('admin-monitor-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, (payload) => {
        setEvents(prev => [{
          id: `trip-${Date.now()}`,
          type: 'trip',
          message: `New trip: ${payload.new.origin_city} → ${payload.new.destination_city}`,
          time: 'JUST NOW'
        }, ...prev].slice(0, 15));
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shipments' }, (payload) => {
        setEvents(prev => [{
          id: `shipment-${Date.now()}`,
          type: 'trip',
          message: `New load posted from ${payload.new.origin_city}`,
          time: 'JUST NOW'
        }, ...prev].slice(0, 15));
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
        setEvents(prev => [{
          id: `request-sent-${Date.now()}`,
          type: 'booking',
          message: `New booking request sent for ${payload.new.weight_tonnes}t`,
          time: 'JUST NOW'
        }, ...prev].slice(0, 15));
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, (payload) => {
        if (payload.new.status === 'accepted' && payload.old.status !== 'accepted') {
          setEvents(prev => [{
            id: `booking-accepted-${Date.now()}`,
            type: 'booking',
            message: `Booking accepted for ${payload.new.weight_tonnes}t load`,
            time: 'JUST NOW'
          }, ...prev].slice(0, 15));
          fetchData();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
        setEvents(prev => [{
          id: `user-${Date.now()}`,
          type: 'user',
          message: `New ${payload.new.user_type} joined: ${payload.new.full_name}`,
          time: 'JUST NOW'
        }, ...prev].slice(0, 15));
        fetchData();
      })
      .subscribe();

    // Set up 15-second interval refresh as requested
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
              <span className="text-[10px] text-slate-400 font-medium uppercase">System Live (15s Sync)</span>
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
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col border-r border-slate-800">
              <ScrollArea className="flex-grow">
                <div className="p-4 space-y-8">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health</h2>
                    </div>
                    <SystemMetricsPanel metrics={metrics} />
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="h-4 w-4 text-purple-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Intelligence</h2>
                    </div>
                    <BusinessMetricsPanel metrics={businessMetrics} />
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Terminal className="h-4 w-4 text-green-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Events</h2>
                    </div>
                    <LiveEventFeed events={events} />
                  </section>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-800" />

          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Real-time Activity</h2>
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono">
                  {users.length} Active Users
                </Badge>
              </div>
              <div className="flex-grow overflow-hidden p-4">
                <UserActivityTable users={users} />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-800" />

          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full relative">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2 rounded-lg backdrop-blur-sm">
                <MapIcon className="h-4 w-4 text-green-400" />
                <span className="text-xs font-bold uppercase tracking-widest">Logistics Map</span>
              </div>
              <TripMapComponent trips={trips} />
              
              <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-xl backdrop-blur-sm shadow-2xl min-w-[120px]">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Active Trips</p>
                  <p className="text-xl font-mono font-bold text-orange-500">
                    {trips.filter(t => t.status === 'active').length}
                  </p>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur-sm shadow-2xl min-w-[120px]">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Completed</p>
                  <p className="text-xl font-mono font-bold text-green-500">
                    {trips.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default MonitoringDashboard;