import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Search, Clock, TrendingUp, PlusCircle } from 'lucide-react';
import { showError } from '@/utils/toast';

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [stats, setStats] = useState({ activeShipments: 0, pendingRequests: 0, completedShipments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile?.id) return;
      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        const supabase = createClerkSupabaseClient(supabaseToken);

        const { count: activeShipments } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending');
        const { count: completedShipments } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'completed');
        const { count: pendingRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending');

        setStats({ activeShipments: activeShipments || 0, pendingRequests: pendingRequests || 0, completedShipments: completedShipments || 0 });
      } catch (err: any) {
        showError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userProfile, getToken]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shipper Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userProfile?.full_name}! Manage your shipments and find trucks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeShipments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Shipments</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.completedShipments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/shipper/post-shipment">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Post New Shipment
              </Button>
            </Link>
            <Link to="/browse-trucks">
              <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                <Search className="mr-2 h-4 w-4" /> Find Available Trucks
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">Check your shipments and booking requests for the latest updates.</p>
            <div className="mt-4 space-y-2">
              <Link to="/shipper/my-shipments" className="block text-sm text-blue-600 hover:underline">View My Shipments →</Link>
              <Link to="/shipper/history" className="block text-sm text-blue-600 hover:underline">View History →</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShipperDashboard;