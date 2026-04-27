import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Map as MapIcon, BarChart3, ShieldCheck, Briefcase, Truck } from 'lucide-react';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';

interface Event {
  id: string;
  type: string;
  message: string;
  time: string;
  raw_date?: string;
}

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [trips, setTrips] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
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
  const [error, setError] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const supabase = await getAuthenticatedClient();

      const { data: tripData } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });
      setTrips(tripData || []);

      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      setShipments(shipmentData || []);

      // Dummy system metrics (replace with real queries as needed)
      setMetrics({
        active_connections: Math.floor(Math.random() * 100),
        api_response_time: Math.floor(Math.random() * 300),
        error_rate: Math.random().toFixed(2),
        active_requests: Math.floor(Math.random() * 50),
      });

      // Business metrics calculation
      const total_shipments = shipmentData?.length || 0;
      const total_trips = tripData?.length || 0;
      const pending_requests = 0; // placeholder
      const accepted_requests = 0; // placeholder
      const estimated_revenue = 0; // placeholder
      const success_rate = 0; // placeholder
      setBusinessMetrics({
        total_shipments,
        total_trips,
        pending_requests,
        accepted_requests,
        estimated_revenue,
        success_rate,
      });

      // Recent events (simple mock)
      const recentEvents: Event[] = [];
      (tripData || []).slice(0, 3).forEach((t: any) => {
        recentEvents.push({
          id: `trip-${t.id}`,
          type: 'trip',
          message: `Trip from ${t.origin_city} to ${t.destination_city}`,
          time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: t.created_at,
        });
      });
      (shipmentData || []).slice(0, 3).forEach((s: any) => {
        recentEvents.push({
          id: `ship-${s.id}`,
          type: 'shipment',
          message: `Shipment from ${s.origin_city}`,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: s.created_at,
        });
      });
      recentEvents.sort((a, b) => new Date(b.raw_date || '').getTime() - new Date(a.raw_date || '').getTime());
      setEvents(recentEvents);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
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

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-200">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(234,88,12,0.4)]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider">Command Center</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Live</span>
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block border-r border-slate-800 pr-4 mr-2">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Sync Token</p>
          <p className="text-[11px] font-mono text-slate-300">ACTIVE_OK</p>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full relative bg-slate-900">
              <TripMapComponent trips={trips} shipments={shipments} />
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-lg backdrop-blur-md shadow-2xl">
                <MapIcon className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Global Logistics Flow</span>
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
              <ResizablePanel defaultSize={30} minSize={25}>
                <div className="h-full flex flex-col p-4 bg-slate-950/50">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Truck className="h-4 w-4 text-orange-600" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Traffic</h2>
                  </div>
                  <LiveEventFeed events={events} />
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
