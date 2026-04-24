"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import UserActivityTable from './UserActivityTable';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import UserInsightsPanel from './UserInsightsPanel';
import GeographicTrendsPanel from './GeographicTrendsPanel';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { Loader2, LayoutDashboard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [metrics, setMetrics] = useState({
    active_connections: 0,
    api_response_time: 0,
    error_rate: 0,
    total_pending_requests: 0
  });

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const supabase = await getAuthenticatedClient();

      // Parallel fetching for performance
      const [
        { data: userData },
        { data: tripData },
        { data: shipmentData },
        { data: requestData },
        { data: metricsData }
      ] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('trips').select('*'),
        supabase.from('shipments').select('*'),
        supabase.from('requests').select('*'),
        supabase.rpc('get_system_metrics')
      ]);

      setUsers(userData || []);
      setTrips(tripData || []);
      setShipments(shipmentData || []);
      setRequests(requestData || []);
      if (metricsData && metricsData[0]) setMetrics(metricsData[0]);

    } catch (err) {
      console.error('[MonitoringDashboard] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculate Business Metrics
  const businessMetrics = {
    totalShipments: shipments.length,
    matchedShipments: shipments.filter(s => s.status === 'matched' || s.status === 'completed').length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    estimatedRevenue: shipments
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.weight_tonnes * s.budget_per_tonne), 0),
    capacityUtilization: trips.length > 0 
      ? (trips.filter(t => t.status === 'completed').length / trips.length) * 100 
      : 0
  };

  // Calculate User Insights
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const userInsights = {
    truckerCount: users.filter(u => u.user_type === 'trucker').length,
    shipperCount: users.filter(u => u.user_type === 'shipper').length,
    newToday: users.filter(u => new Date(u.created_at) >= today).length,
    topUsers: [...users].sort((a, b) => (b.total_trips || 0) - (a.total_trips || 0)).slice(0, 5)
  };

  // Calculate Geographic Trends
  const routeCounts: Record<string, number> = {};
  const stateActivity: Record<string, { demand: number; supply: number }> = {};

  trips.forEach(t => {
    const route = `${t.origin_city}-${t.destination_city}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
    
    if (t.origin_state) {
      if (!stateActivity[t.origin_state]) stateActivity[t.origin_state] = { demand: 0, supply: 0 };
      stateActivity[t.origin_state].supply += 1;
    }
  });

  shipments.forEach(s => {
    if (s.origin_state) {
      if (!stateActivity[s.origin_state]) stateActivity[s.origin_state] = { demand: 0, supply: 0 };
      stateActivity[s.origin_state].demand += 1;
    }
  });

  const geoTrends = {
    popularRoutes: Object.entries(routeCounts)
      .map(([route, count]) => ({ 
        origin: route.split('-')[0], 
        destination: route.split('-')[1], 
        count 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    stateActivity
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-slate-400 font-medium animate-pulse">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-1.5 rounded shadow-lg shadow-orange-500/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tight uppercase">
            LoadSaathi <span className="text-orange-500">Command Center</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-slate-500 hidden md:block">
            SYSTEM_STATUS: <span className="text-emerald-500">OPTIMAL</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchData()} 
            disabled={refreshing}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow overflow-hidden p-4">
        <ResizablePanelGroup direction="horizontal" className="rounded-lg border border-slate-800">
          {/* Left Column: Metrics & Insights */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full overflow-y-auto p-4 space-y-6 bg-slate-950/50 custom-scrollbar">
              <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Marketplace Health</h3>
                <BusinessMetricsPanel metrics={businessMetrics} />
              </section>
              
              <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">User Intelligence</h3>
                <UserInsightsPanel insights={userInsights} />
              </section>

              <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System Infrastructure</h3>
                <SystemMetricsPanel metrics={metrics} />
              </section>
            </div>
          </ResizablePanel>

          <ResizableHandle className="bg-slate-800 w-1" />

          {/* Center Column: Map & Activity */}
          <ResizablePanel defaultSize={50}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60}>
                <div className="h-full p-4 bg-slate-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Logistics Network</h3>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" /> Trips
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" /> Shipments
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100%-2rem)] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                    <TripMapComponent trips={trips} />
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle className="bg-slate-800 h-1" />
              
              <ResizablePanel defaultSize={40}>
                <div className="h-full p-4 bg-slate-950">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Real-time User Activity</h3>
                  <UserActivityTable users={users} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="bg-slate-800 w-1" />

          {/* Right Column: Geographic Trends */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full overflow-y-auto p-4 space-y-6 bg-slate-950/50 custom-scrollbar">
              <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Geographic Trends</h3>
                <GeographicTrendsPanel trends={geoTrends} />
              </section>

              <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Quick Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Active Trips</span>
                    <span className="font-bold text-orange-400">{trips.filter(t => t.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Pending Loads</span>
                    <span className="font-bold text-blue-400">{shipments.filter(s => s.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg. Price / Tonne</span>
                    <span className="font-bold text-emerald-400">
                      ₹{trips.length > 0 ? Math.round(trips.reduce((a, b) => a + b.price_per_tonne, 0) / trips.length) : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default MonitoringDashboard;