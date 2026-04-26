"use client";

import { useEffect, useState, useCallback } from 'react';
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
  ArrowRight,
  Package,
  Calendar,
  Star as StarIcon
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

  const fetchDashboardData = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);

      // 1. Active Trips count
      const { count: activeCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('trucker_id', userProfile.id)
        .eq('status', 'active');

      // 2. Pending Booking Requests count (shipper -> trip)
      const { count: pendingBookingCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userProfile.id)
        .eq('status', 'pending');

      // 3. Completed Trips count
      const { count: completedCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('trucker_id', userProfile.id)
        .eq('status', 'completed');

      // 4. Calculate total earnings (both from bookings and offers)
      // a. From bookings accepted (shipper -> trip)
      const { data: bookingEarnings } = await supabase
        .from('requests')
        .select('weight_tonnes, trip:trips(price_per_tonne)')
        .eq('receiver_id', userProfile.id)
        .eq('status', 'accepted');

      // b. From offers accepted (trucker -> load)
      const { data: offerEarnings } = await supabase
        .from('shipment_requests')
        .select('proposed_price_per_tonne, shipment:shipments(weight_tonnes)')
        .eq('trucker_id', userProfile.id)
        .eq('status', 'accepted');

      const totalEarnings = (
        (bookingEarnings?.reduce((sum, r: any) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0) || 0) +
        (offerEarnings?.reduce((sum, o: any) => sum + ((o.proposed_price_per_tonne || 0) * (o.shipment?.weight_tonnes || 0)), 0) || 0)
      );

      setStats({
        activeTrips: activeCount || 0,
        pendingRequests: pendingBookingCount || 0,
        completedTrips: completedCount || 0,
        totalEarnings
      });
    } catch (err: any) {
      console.error('[TruckerDashboard] Error:', err);
      showError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getToken]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Trucker Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome, {userProfile?.full_name || 'Partner'}! You have <span className="text-orange-600 font-bold">{stats.activeTrips}</span> active trips.
          </p>
        </div>
        <div className="bg-yellow-50 px-4 py-2 rounded-2xl border border-yellow-100 flex items-center gap-2">
          <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="text-sm font-black text-yellow-700">{userProfile?.rating?.toFixed(1) || '0.0'} Partner Rating</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Trips</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-black text-gray-900">{stats.activeTrips}</div>}
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-black text-gray-900">{stats.pendingRequests}</div>}
          </CardContent>
        </Card>

        <Card className="border-green-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-black text-gray-900">{stats.completedTrips}</div>}
          </CardContent>
        </Card>

        <Card className="border-green-50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-3xl font-black text-green-600">
                ₹{stats.totalEarnings.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-orange-200 shadow-md">
          <CardHeader className="bg-orange-50/50">
            <CardTitle className="text-xl font-black text-gray-900">Partner Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Link to="/trucker/post-trip" className="block">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-14 text-lg font-bold shadow-sm">
                <PlusCircle className="mr-2 h-5 w-5" /> Post New Trip
              </Button>
            </Link>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/trucker/browse-shipments">
                <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 h-12 font-bold">
                  <Search className="mr-2 h-4 w-4" /> Find Loads
                </Button>
              </Link>
              <Link to="/trucker/my-trips">
                <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 h-12 font-bold">
                  <Truck className="mr-2 h-4 w-4" /> Manage Trips
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl font-black text-gray-900">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              <Link to="/trucker/my-trips?tab=incoming" className="flex items-center justify-between p-4 hover:bg-orange-50 rounded-2xl transition-all group border border-transparent hover:border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-2 rounded-xl group-hover:bg-orange-600 transition-colors"><Package className="h-5 w-5 text-orange-600 group-hover:text-white" /></div>
                  <div>
                    <p className="font-bold text-gray-800">Booking Requests</p>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Incoming from shippers</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-200 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link to="/trucker/history" className="flex items-center justify-between p-4 hover:bg-orange-50 rounded-2xl transition-all group border border-transparent hover:border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-600 transition-colors"><Calendar className="h-5 w-5 text-blue-600 group-hover:text-white" /></div>
                  <div>
                    <p className="font-bold text-gray-800">Work History</p>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Past trips and earnings</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-200 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TruckerDashboard;