"use client";

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  Clock, 
  TrendingUp, 
  IndianRupee, 
  PlusCircle, 
  Search, 
  Settings,
  ArrowRight
} from 'lucide-react';
import { showError } from '@/utils/toast';

const TruckerDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeTrips: 0,
    pendingRequests: 0,
    completedTrips: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile?.id) return;

      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        
        const supabase = createClerkSupabaseClient(supabaseToken);

        // 1. Active Trips
        const { count: activeCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('trucker_id', userProfile.id)
          .eq('status', 'active');

        // 2. Pending Requests
        const { count: pendingCount } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userProfile.id)
          .eq('status', 'pending');

        // 3. Completed Trips
        const { count: completedCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('trucker_id', userProfile.id)
          .eq('status', 'completed');

        // 4. Total Earnings (Sum of accepted requests)
        const { data: earningsData } = await supabase
          .from('requests')
          .select('weight_tonnes, trip:trips(price_per_tonne)')
          .eq('receiver_id', userProfile.id)
          .eq('status', 'accepted');

        const totalEarnings = earningsData?.reduce((sum, req: any) => {
          return sum + (req.weight_tonnes * (req.trip?.price_per_tonne || 0));
        }, 0) || 0;

        setStats({
          activeTrips: activeCount || 0,
          pendingRequests: pendingCount || 0,
          completedTrips: completedCount || 0,
          totalEarnings
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        showError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userProfile, getToken]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Trucker Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {userProfile?.full_name || 'User'}! Manage your trips and find new loads.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-orange-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Trips</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{stats.activeTrips}</div>}
          </CardContent>
        </Card>

        <Card className="border-orange-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{stats.pendingRequests}</div>}
          </CardContent>
        </Card>

        <Card className="border-orange-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Trips</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{stats.completedTrips}</div>}
          </CardContent>
        </Card>

        <Card className="border-orange-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                ₹{stats.totalEarnings.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card className="border-orange-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/trucker/post-trip" className="block">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-semibold">
                <PlusCircle className="mr-2 h-5 w-5" /> Post New Trip
              </Button>
            </Link>
            <Link to="/trucker/browse-shipments" className="block">
              <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 h-12 text-lg">
                <Search className="mr-2 h-5 w-5" /> Find Goods to Carry
              </Button>
            </Link>
            <Link to="/trucker/my-trips" className="block">
              <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 h-12 text-lg">
                <Truck className="mr-2 h-5 w-5" /> Manage My Trips & Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-6">Check your trips and requests for the latest updates.</p>
            <div className="space-y-4">
              <Link to="/trucker/my-trips?tab=incoming" className="flex items-center text-orange-600 hover:underline font-medium">
                View My Requests <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/trucker/history" className="flex items-center text-orange-600 hover:underline font-medium">
                View History <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/profile" className="flex items-center text-orange-600 hover:underline font-medium">
                Update Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TruckerDashboard;