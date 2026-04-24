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
  Map as MapIcon, 
  BarChart3, 
  RefreshCw, 
  ShieldCheck,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserActivityTable from './UserActivityTable';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';
import { showError } from '@/utils/toast';

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [metrics, setMetrics] = useState({ 
    active_connections: 0, 
    api_response_time: 0, 
    error_rate: 0,
    active_requests: 0 
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const supabase = await getAuthenticatedClient();

      // Fetch active users
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (userData) setUsers(userData);

      // Fetch trips
      const { data: tripData } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tripData) setTrips(tripData);

      // Fetch system metrics via RPC
      const { data: metricsData, error: metricsError } = await supabase.rpc('get_system_metrics');
      if (!metricsError && metricsData) {
        // RPC returns a table/array, take the first row
        setMetrics(Array.isArray(metricsData) ? metricsData[0] : metricsData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Monitoring] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15-second refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      {/* Top Navigation Bar */}
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
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Resizable Layout */}
      <main className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar: Metrics & Activity */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={40} minSize={30}>
                <div className="h-full p-4 overflow-auto border-r border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health</h2>
                  </div>
                  <SystemMetricsPanel metrics={metrics} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-slate-800" />
              
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full p-4 overflow-hidden flex flex-col border-r border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">User Activity</h2>
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono">
                      {users.length} Active
                    </Badge>
                  </div>
                  <UserActivityTable users={users} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-800" />

          {/* Right Main: Map View */}
          <ResizablePanel defaultSize={70}>
            <div className="h-full relative">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2 rounded-lg backdrop-blur-sm">
                <MapIcon className="h-4 w-4 text-green-400" />
                <span className="text-xs font-bold uppercase tracking-widest">Live Logistics Map</span>
              </div>
              <TripMapComponent trips={trips} />
              
              {/* Map Overlay Stats */}
              <div className="absolute bottom-6 right-6 z-10 flex gap-4">
                <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl backdrop-blur-sm shadow-2xl">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Active Trips</p>
                  <p className="text-2xl font-mono font-bold text-orange-500">
                    {trips.filter(t => t.status === 'active').length}
                  </p>
                </div>
                <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl backdrop-blur-sm shadow-2xl">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Completed</p>
                  <p className="text-2xl font-mono font-bold text-green-500">
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