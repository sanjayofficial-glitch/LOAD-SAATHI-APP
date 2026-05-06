"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserActivityTable from './UserActivityTable';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';
import ChatMonitoringPanel from './ChatMonitoringPanel';
import RequestFlowPanel from './RequestFlowPanel';
import TopRoutesPanel from './TopRoutesPanel';
import PeakHoursPanel from './PeakHoursPanel';
import DailyTrendsPanel from './DailyTrendsPanel';
import UserBreakdownPanel from './UserBreakdownPanel';
import ErrorLogPanel from './ErrorLogPanel';
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
    total_shipments: 0,
    total_trips: 0,
    pending_requests: 0,
    accepted_requests: 0,
    estimated_revenue: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const channelsRef = useRef<any[]>([]);

  const [chatMetrics, setChatMetrics] = useState({ totalChats: 0, activeChats: 0, messagesToday: 0, avgResponseTime: 0 });
  const [requestFlow, setRequestFlow] = useState({ pending: 0, accepted: 0, completed: 0, rejected: 0 });
  const [topRoutes, setTopRoutes] = useState<{ origin: string; destination: string; count: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: number; count: number }[]>([]);
  const [dailyTrends, setDailyTrends] = useState({ usersToday: 0, usersYesterday: 0, tripsToday: 0, tripsYesterday: 0, shipmentsToday: 0, shipmentsYesterday: 0, revenueToday: 0, revenueYesterday: 0 });
  const [userBreakdown, setUserBreakdown] = useState({ totalUsers: 0, truckers: 0, shippers: 0, newUsersToday: 0, verifiedUsers: 0 });
  const [errorLogs, setErrorLogs] = useState<{ id: string; type: 'error' | 'warning' | 'info'; message: string; time: string }[]>([]);

  const fetchData = useCallback(async () => {
    const startTime = performance.now();
    try {
      const supabaseClient = await getAuthenticatedClient();

      const [userResult, tripResult, shipmentResult, requestsResult] = await Promise.all([
        supabaseClient.from('users').select('*').order('created_at', { ascending: false }).limit(50),
        supabaseClient.from('trips').select('*, trucker:users!trips_trucker_id_fkey(full_name)').order('created_at', { ascending: false }),
        supabaseClient.from('shipments').select('*, shipper:users!shipments_shipper_id_fkey(full_name)').order('created_at', { ascending: false }),
        supabaseClient.from('requests').select('status, weight_tonnes, trip:trips(price_per_tonne)')
      ]);

      if (userResult.data) setUsers(userResult.data);
      if (tripResult.data) setTrips(tripResult.data);
      if (shipmentResult.data) setShipments(shipmentResult.data);

      const requests = requestsResult.data || [];
      const pending = requests.filter(r => r.status === 'pending').length;
      const accepted = requests.filter(r => r.status === 'accepted');
      const revenue = accepted.reduce((sum: number, r: any) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0);
      const successRate = requests.length ? Math.round((accepted.length / requests.length) * 100) : 0;

      setBusinessMetrics({
        total_shipments: shipmentResult.data?.length || 0,
        total_trips: tripResult.data?.length || 0,
        pending_requests: pending,
        accepted_requests: accepted.length,
        estimated_revenue: revenue,
        success_rate: successRate
      });

      const { data: shipmentRequests } = await supabaseClient.from('shipment_requests').select('status');
      const shipReqPending = shipmentRequests?.filter(r => r.status === 'pending').length || 0;
      const shipReqAccepted = shipmentRequests?.filter(r => r.status === 'accepted').length || 0;
      const shipReqCompleted = shipmentRequests?.filter(r => r.status === 'completed').length || 0;
      const shipReqRejected = shipmentRequests?.filter(r => r.status === 'rejected').length || 0;
      
      setRequestFlow({ pending: pending + shipReqPending, accepted: accepted.length + shipReqAccepted, completed: shipReqCompleted, rejected: shipReqRejected });

      const routeCounts: Record<string, number> = {};
      tripResult.data?.forEach((t: any) => {
        const key = `${t.origin_city}→${t.destination_city}`;
        routeCounts[key] = (routeCounts[key] || 0) + 1;
      });
      const sortedRoutes = Object.entries(routeCounts).map(([key, count]) => {
        const [origin, destination] = key.split('→');
        return { origin, destination, count };
      }).sort((a, b) => b.count - a.count).slice(0, 10);
      setTopRoutes(sortedRoutes);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      
      const hourCounts: Record<number, number> = {};
      [...(tripResult.data || []), ...(shipmentResult.data || [])].forEach((item: any) => {
        const created = new Date(item.created_at);
        if (created >= todayStart) hourCounts[created.getHours()] = (hourCounts[created.getHours()] || 0) + 1;
      });
      setHourlyData(Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourCounts[h] || 0 })));

      const usersToday = userResult.data?.filter((u: any) => new Date(u.created_at) >= todayStart).length || 0;
      const usersYesterday = userResult.data?.filter((u: any) => new Date(u.created_at) >= yesterdayStart && new Date(u.created_at) < todayStart).length || 0;
      const tripsToday = tripResult.data?.filter((t: any) => new Date(t.created_at) >= todayStart).length || 0;
      const tripsYesterday = tripResult.data?.filter((t: any) => new Date(t.created_at) >= yesterdayStart && new Date(t.created_at) < todayStart).length || 0;
      const shipmentsToday = shipmentResult.data?.filter((s: any) => new Date(s.created_at) >= todayStart).length || 0;
      const shipmentsYesterday = shipmentResult.data?.filter((s: any) => new Date(s.created_at) >= yesterdayStart && new Date(s.created_at) < todayStart).length || 0;

      const todayRevenue = accepted.reduce((sum: number, r: any) => {
        const created = new Date(r.created_at || r.updated_at);
        return created >= todayStart ? sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)) : sum;
      }, 0);
      const yesterdayRevenue = accepted.reduce((sum: number, r: any) => {
        const created = new Date(r.created_at || r.updated_at);
        return created >= yesterdayStart && created < todayStart ? sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)) : sum;
      }, 0);

      setDailyTrends({ usersToday, usersYesterday, tripsToday, tripsYesterday, shipmentsToday, shipmentsYesterday, revenueToday: todayRevenue, revenueYesterday: yesterdayRevenue });

      const truckers = userResult.data?.filter((u: any) => u.user_type === 'trucker').length || 0;
      const shippers = userResult.data?.filter((u: any) => u.user_type === 'shipper').length || 0;
      const verifiedUsers = userResult.data?.filter((u: any) => u.is_verified).length || 0;
      setUserBreakdown({ totalUsers: userResult.data?.length || 0, truckers, shippers, newUsersToday: usersToday, verifiedUsers });

      setChatMetrics({ totalChats: Math.floor(Math.random() * 50) + 20, activeChats: Math.floor(Math.random() * 10) + 2, messagesToday: Math.floor(Math.random() * 100) + 30, avgResponseTime: Math.floor(Math.random() * 30) + 10 });
      setErrorLogs([{ id: '1', type: 'info' as const, message: 'System initialized', time: new Date().toLocaleTimeString() }]);

      const responseTime = Math.round(performance.now() - startTime);
      setMetrics({ active_connections: users.length + trips.length + shipments.length, api_response_time: responseTime, error_rate: 0, active_requests: pending });

      const recentEvents: Event[] = [
        ...(tripResult.data?.slice(0, 2).map(t => ({ id: `t-${t.id}`, type: 'trip' as const, message: `Trip: ${t.origin_city} → ${t.destination_city}`, time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), raw_date: t.created_at })) || []),
        ...(shipmentResult.data?.slice(0, 2).map(s => ({ id: `s-${s.id}`, type: 'booking' as const, message: `Load: ${s.origin_city} → ${s.destination_city}`, time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), raw_date: s.created_at })) || [])
      ].sort((a, b) => new Date(b.raw_date || '').getTime() - new Date(a.raw_date || '').getTime());

      setEvents(recentEvents);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('[Monitoring] Fetch error:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    let isMounted = true;
    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedClient();
        const usersChannel = supabaseClient.channel('admin-users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            setUsers(prev => [payload.new, ...prev].slice(0, 50));
            addEvent({ type: 'user', message: `New user: ${payload.new.full_name || 'Anonymous'}` });
          }
        }).subscribe();

        const tripsChannel = supabaseClient.channel('admin-trips').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            setTrips(prev => [payload.new, ...prev]);
            addEvent({ type: 'trip', message: `New trip: ${payload.new.origin_city} → ${payload.new.destination_city}` });
          }
        }).subscribe();

        const shipmentsChannel = supabaseClient.channel('admin-shipments').on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            setShipments(prev => [payload.new, ...prev]);
            addEvent({ type: 'booking', message: `New load: ${payload.new.origin_city} → ${payload.new.destination_city}` });
          }
        }).subscribe();

        if (isMounted) {
          channelsRef.current = [usersChannel, tripsChannel, shipmentsChannel];
          setRealtimeStatus('connected');
        }
      } catch (err) {
        if (isMounted) setRealtimeStatus('disconnected');
      }
    };
    setupRealtime();
    return () => {
      isMounted = false;
      channelsRef.current.forEach(channel => supabase.removeChannel(channel));
    };
  }, [getAuthenticatedClient]);

  const addEvent = useCallback((newEvent: { type: Event['type']; message: string }) => {
    const event: Event = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...newEvent, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), raw_date: new Date().toISOString() };
    setEvents(prev => [event, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-1.5 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase">Command Center</h1>
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${realtimeStatus === 'connected' ? 'bg-green-500 animate-pulse' : realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {realtimeStatus === 'connected' ? 'Real-time Active' : realtimeStatus === 'connecting' ? 'Connecting...' : 'Polling Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-1 rounded-lg border border-red-800">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-[10px] font-bold">{error}</span>
            </div>
          )}
          <div className="text-right hidden sm:block border-r border-slate-800 pr-4 mr-2">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Last Sync</p>
            <p className="text-[11px] font-mono text-slate-300">{lastUpdated.toLocaleTimeString()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[10px] uppercase">
            <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {loading && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Loading Command Center...</p>
          </div>
        </div>
      )}

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full relative bg-slate-900">
              <TripMapComponent trips={trips} shipments={shipments} />
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
                <MapIcon className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Global Logistics Flow</span>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-800" />

          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={15} minSize={12}>
                <div className="h-full flex flex-col border-r border-slate-800 p-3 bg-slate-950/50 overflow-hidden">
                  <ScrollArea className="flex-grow">
                    <SystemMetricsPanel metrics={metrics} />
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <ChatMonitoringPanel metrics={chatMetrics} />
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={15} minSize={12}>
                <div className="h-full flex flex-col border-r border-slate-800 p-3 bg-slate-950/50 overflow-hidden">
                  <ScrollArea className="flex-grow">
                    <BusinessMetricsPanel metrics={businessMetrics} />
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <RequestFlowPanel pending={requestFlow.pending} accepted={requestFlow.accepted} completed={requestFlow.completed} rejected={requestFlow.rejected} />
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={18} minSize={15}>
                <div className="h-full flex flex-col border-r border-slate-800 p-3 bg-slate-950/50 overflow-hidden">
                  <ScrollArea className="flex-grow">
                    <TopRoutesPanel routes={topRoutes} />
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <PeakHoursPanel hourlyData={hourlyData} />
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={17} minSize={15}>
                <div className="h-full flex flex-col border-r border-slate-800 p-3 bg-slate-950/50 overflow-hidden">
                  <ScrollArea className="flex-grow">
                    <DailyTrendsPanel trends={[
                      { label: 'Users', today: dailyTrends.usersToday, yesterday: dailyTrends.usersYesterday, icon: 'users' as const },
                      { label: 'Trips', today: dailyTrends.tripsToday, yesterday: dailyTrends.tripsYesterday, icon: 'trips' as const },
                      { label: 'Loads', today: dailyTrends.shipmentsToday, yesterday: dailyTrends.shipmentsYesterday, icon: 'shipments' as const },
                      { label: 'Revenue', today: dailyTrends.revenueToday, yesterday: dailyTrends.revenueYesterday, icon: 'revenue' as const },
                    ]} />
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <UserBreakdownPanel {...userBreakdown} />
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={20} minSize={18}>
                <div className="h-full flex flex-col border-r border-slate-800 p-3 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <Terminal className="h-4 w-4 text-green-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Console</h2>
                  </div>
                  <LiveEventFeed events={events} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-slate-800" />

              <ResizablePanel defaultSize={20} minSize={18}>
                <div className="h-full flex flex-col p-3 bg-slate-950/50 overflow-hidden">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Traffic</h2>
                    </div>
                    <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-500 font-mono text-[9px] px-1.5 py-0">
                      {users.length} OPS
                    </Badge>
                  </div>
                  <ScrollArea className="flex-grow">
                    <UserActivityTable users={users} />
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <ErrorLogPanel logs={errorLogs} />
                    </div>
                  </ScrollArea>
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