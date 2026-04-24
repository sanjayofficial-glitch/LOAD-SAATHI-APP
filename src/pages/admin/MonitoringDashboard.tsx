import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserActivityTable } from './UserActivityTable';
import { TripMapComponent } from './TripMapComponent';
import { SystemMetricsPanel } from './SystemMetricsPanel';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const MonitoringDashboard = () => {
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [metrics, setMetrics] = useState({ 
    activeConnections: 0, 
    apiResponseTime: 0, 
    errorRate: 0,
    activeRequests: 0 
  });
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  
  const [tab, setTab] = useState(defaultTab);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch active users        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        setUsers(userData);

        // Fetch trip statuses        const { data: tripData } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });

        setTrips(tripData);

        // Fetch system metrics
        const { data: metricsData } = await supabase
          .rpc('get_system_metrics', {})
          .single();

        setMetrics(metricsData);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setTabLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    // Navigate to new tab (would normally use router.navigate)
  };

  return (
    <div className="min-h-screen w-full p-4 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control & Monitoring Center</h1>
          <p className="text-gray-600">Real-time oversight of all platform activities</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setTab('overview')}
            className={tab === 'overview' ? 'border-b-2 border-blue-500' : 'text-gray-600'}
          >
            Overview          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setTab('users')}
            className={tab === 'users' ? 'border-b-2 border-blue-500' : 'text-gray-600'}
          >
            Users
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setTab('trips')}
            className={tab === 'trips' ? 'border-b-2 border-blue-500' : 'text-gray-600'}
          >
            Trips
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setTab('metrics')}
            className={tab === 'metrics' ? 'border-b-2 border-blue-500' : 'text-gray-600'}
          >
            Metrics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Activity Section */}
        <div className="md:col-span-2">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
              <CardTitle className="text-2xl font-bold text-blue-900">User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {tab === 'users' ? (
                <UserActivityTable users={users} />
              ) : (
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl">👤</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Users: {users.length}</p>
                      <p className="text-sm text-gray-500">Active Users: {users.filter(u => 
                        u.last_activity && new Date().getTime() - new Date(u.last_activity).getTime() < 86400000).length}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trip Map Section */}
        <div className="md:col-span-2">
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="text-2xl font-bold text-orange-900">
                {tab === 'trips' ? 'Active Trips' : 'Trip Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tab === 'trips' ? (
                <TripMapComponent trips={trips} />
              ) : (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-xl">🚛</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">View all active trips on the map</p>
                    <Button                       onClick={() => setTab('trips')}
                      className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
                    >
                      View Trips                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Metrics Section */}
        <div className="md:col-span-1">
          <Card className="border-purple-100 shadow-sm">
            <CardHeader className="bg-purple-50/50 border-b border-purple-100">
              <CardTitle className="text-2xl font-bold text-purple-900">
                {tab === 'metrics' ? 'System Metrics' : 'Performance Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tab === 'metrics' ? (
                <SystemMetricsPanel metrics={metrics} />
              ) : (
                <div className="p-4 space-y-4 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-xl">📊</span>
                    </div>
                    <p className="text-sm text-gray-500">System performance metrics</p>
                    <p className="text-sm text-gray-500">Monitor API response times, error rates, and connection status</p>
                  </div>
                  <Button 
                    onClick={() => setTab('metrics')}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  >
                    View Metrics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="mt-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-orange-600 text-8xl">📦</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Control Center</h2>
              <p className="text-lg text-gray-600 mb-6">
                Monitor all platform activities from this dashboard. 
                Use the tabs above to navigate between sections.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setTab('users')}>
                  View Users                </Button>
                <Button variant="outline" onClick={() => setTab('trips')}>
                  View Trips
                </Button>
                <Button variant="outline" onClick={() => setTab('metrics')}>
                  View Metrics
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600 mb-3">
                Manage all registered users and their activity status
              </p>
            </div>
            <UserActivityTable users={users} />
          </div>
        )}

        {tab === 'trips' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900">Trip Management</h2>
              <p className="text-gray-600 mb-3">
                Monitor all active and completed trips across the platform
              </p>
            </div>
            <TripMapComponent trips={trips} />
          </div>
        )}

        {tab === 'metrics' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900">System Performance</h2>
              <p className="text-gray-600 mb-3">
                Monitor API response times, error rates, and system health              </p>
            </div>
            <SystemMetricsPanel metrics={metrics} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;