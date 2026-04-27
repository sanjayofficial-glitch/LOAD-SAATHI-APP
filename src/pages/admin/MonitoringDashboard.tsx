"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Map as MapIcon, BarChart3, ShieldCheck, Briefcase, Truck } from 'lucide-react';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';

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

      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      setTrips(tripData || []);
      setShipments(shipmentData || []);

      setMetrics({
        active_connections: Math.floor(Math.random() * 100),
        api_response_time: Math.floor(Math.random() * 300),
        error_rate: parseFloat((Math.random() * 10).toFixed(2)),
        active_requests: Math.floor(Math.random() * 50),
      });

      setBusinessMetrics({
        total_shipments: shipmentData?.length || 0,
        total_trips: tripData?.length || 0,
        pending_requests: 5,
        accepted_requests: 12,
        estimated_revenue: 45000,
        success_rate: 78,
      });

      const recentEvents: SystemEvent[] = [];
      (tripData || []).slice(0, 3).forEach((t: any) => {
        recentEvents.push({
          id: `trip-${t.id}`,
          type: 'trip',
          message: `New trip: ${t.origin_city} to ${t.destination_city}`,
          time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: t.created_at,
        });
      });
      
      setEvents(recentEvents.sort((a, b) => 
        new Date(b.raw_date || '').getTime() - new Date(a.raw_date || '').getTime()
      ));
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-200">Loading...</div>;
  if (error) return <div className="p-4 text-red-500 bg-slate-950 h-screen">{error}</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-1.5 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-wider">Command Center</h1>
        </div>
      </header>

      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full relative bg-slate-900">
              <TripMapComponent trips={trips} shipments={shipments} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-slate-800" />
          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={25}>
                <div className="h-full p-4 border-r border-slate-800">
                  <SystemMetricsPanel metrics={metrics} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-slate-800" />
              <ResizablePanel defaultSize={25}>
                <div className="h-full p-4 border-r border-slate-800">
                  <BusinessMetricsPanel metrics={businessMetrics} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-slate-800" />
              <ResizablePanel defaultSize={50}>
                <div className="h-full p-4">
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