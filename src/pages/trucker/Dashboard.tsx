import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Clock, TrendingUp, PlusCircle, Search } from 'lucide-react';
import { showError } from '@/utils/toast';

const TruckerDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [stats, setStats] = useState({ activeTrips: 0, pendingRequests: 0, completedTrips: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile?.id) return;
      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        const supabase = createClerkSupabaseClient(supabaseToken);

        const { count: activeTrips } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('trucker_id', userProfile.id).eq('status', 'active');
        const { count: completedTrips } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('trucker_id', userProfile.id).eq('status', 'completed');
        
        const { data: myTrips } = await supabase.from('trips').select('id').eq('trucker_id', userProfile.id).eq('status', 'active');
        const tripIds = myTrips?.map(t => t.id) || [];
        let pendingRequests = 0;
        if (tripIds.length > 0) {
          const { count } = await supabase.from('requests').select('*', { count: 'exact', head: true }).in('trip_id', tripIds).eq('status', 'pending');
          pendingRequests = count || 0;
        }

        setStats({ activeTrips: activeTrips || 0, pendingRequests, completedTrips: completedTrips || 0 });
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
        <h1 className="text-3xl font-bold text-gray-900">Trucker Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userProfile?.full_name}! Manage your trips and find new loads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeTrips}</div>
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
            <CardTitle className="text-sm font-medium">Completed Trips</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.completedTrips}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/trucker/post-trip">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Post New Trip
              </Button>
            </Link>
            <Link to="/trucker/browse-shipments">
              <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                <Search className="mr-2 h-4 w-4" /> Find Goods to Carry
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">Check your trips and requests for the latest updates.</p>
            <div className="mt-4 space-y-2">
              <Link to="/trucker/my-trips" className="block text-sm text-orange-600 hover:underline">View My Trips →</Link>
              <Link to="/trucker/my-requests" className="block text-sm text-orange-600 hover:underline">View My Requests →</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TruckerDashboard;