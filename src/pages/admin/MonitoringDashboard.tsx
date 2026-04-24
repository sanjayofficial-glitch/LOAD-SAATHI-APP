import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserActivityTable from './UserActivityTable';
import TripMapComponent from './TripMapComponent';
import SystemMetricsPanel from './SystemMetricsPanel';

const MonitoringDashboard = () => {
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [metrics, setMetrics] = useState({ activeConnections: 0, apiResponseTime: 0, errorRate: 0 });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch active users (truckers and shippers)
      const { data } = await supabase
        .from('users')
        .select('*')
        .in('user_type', ['trucker', 'shipper']);
      setUsers(data);

      // Fetch trip statuses
      const { data: tripData } = await supabase.from('trips').select('*');
      setTrips(tripData);

      // Fetch system metrics (example implementation)
      const { data: metricsData } = await supabase.rpc('get_system_metrics', {});
      setMetrics(metricsData);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30-second polling

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full p-4 flex flex-col">
      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold mb-4">User Activity</h2>
        <UserActivityTable users={users} />
      </div>

      <div className="flex-2 p-4">
        <h2 className="text-2xl font-bold mb-4">Trip Map</h2>
        <TripMapComponent trips={trips} />
      </div>

      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold mb-4">System Metrics</h2>
        <SystemMetricsPanel metrics={metrics} />
      </div>
    </div>
  );
};

export default MonitoringDashboard;