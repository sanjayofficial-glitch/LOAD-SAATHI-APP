"use client";

import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  Clock, 
  TrendingUp, 
  PlusCircle, 
  DollarSign, 
  Calendar, 
  MapPin,
  Truck,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mt-1" />
    </CardContent>
  </Card>
);

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    activeShipments: 0, 
    pendingRequests: 0, 
    completedShipments: 0,
    totalSpent: 0,
    upcomingShipments: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);

      // Fetch all data in parallel for maximum speed
      const [
        activeRes,
        completedRes,
        pendingOffersRes,
        requestSpentRes,
        offerSpentRes,
        upcomingRes
      ] = await Promise.all([
        supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending'),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'completed'),
        supabase.from('shipment_requests').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending'),
        supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('shipper_id', userProfile.id).eq('status', 'accepted'),
        supabase.from('shipment_requests').select('proposed_price_per_tonne, shipment:shipments(weight_tonnes)').eq('shipper_id', userProfile.id).eq('status', 'accepted'),
        supabase.from('shipments').select('*').eq('shipper_id', userProfile.id).eq('status', 'pending').order('departure_date', { ascending: true }).limit(3)
      ]);

      const totalSpent = (
        (requestSpentRes.data?.reduce((sum, r: any) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0) || 0) +
        (offerSpentRes.data?.reduce((sum, o: any) => sum + ((o.proposed_price_per_tonne || 0) * (o.shipment?.weight_tonnes || 0)), 0) || 0)
      );

      setStats({ 
        activeShipments: activeRes.count || 0, 
        pendingRequests: pendingOffersRes.count || 0, 
        completedShipments: completedRes.count || 0,
        totalSpent,
        upcomingShipments: upcomingRes.data || []
      });
    } catch (err: any) {
      console.error('[ShipperDashboard] Error:', err);
      showError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getToken]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleCancelShipment = async (shipmentId: string) => {
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('shipments')
        .update({ status: 'cancelled' })
        .eq('id', shipmentId);
        
      if (error) throw error;
      showSuccess('Shipment cancelled successfully');
      loadStats();
    } catch (err: any) {
      showError('Failed to cancel shipment');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">Shipper Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {userProfile?.full_name || 'Shipper'}! Manage your loads and find the best trucks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Loads</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gray-900">{stats.activeShipments}</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Offers</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gray-900">{stats.pendingRequests}</div>
              </CardContent>
            </Card>
            <Card className="border-green-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gray-900">{stats.completedShipments}</div>
              </CardContent>
            </Card>
            <Card className="border-green-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-green-600">₹{stats.totalSpent.toLocaleString()}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="border-blue-100 shadow-md">
          <CardHeader className="bg-blue-50/30">
            <CardTitle className="text-xl font-black text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Link to="/shipper/post-shipment" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold shadow-sm">
                <PlusCircle className="mr-2 h-5 w-5" /> Post New Load
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/browse-trucks">
                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 h-12 font-bold">
                  <Search className="mr-2 h-4 w-4" /> Find Trucks
                </Button>
              </Link>
              <Link to="/shipper/my-shipments">
                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 h-12 font-bold">
                  <Package className="mr-2 h-4 w-4" /> My Loads
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl font-black text-gray-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <Link to="/shipper/my-shipments?tab=incoming" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg"><Clock className="h-4 w-4 text-orange-600" /></div>
                  <span className="font-bold text-gray-700">Check Incoming Offers</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </Link>
              <Link to="/shipper/history" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><Calendar className="h-4 w-4 text-blue-600" /></div>
                  <span className="font-bold text-gray-700">View Activity History</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </Link>
              <Link to="/profile" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg"><Truck className="h-4 w-4 text-gray-600" /></div>
                  <span className="font-bold text-gray-700">Update Profile Settings</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {!loading && stats.upcomingShipments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900">Upcoming Shipments</h2>
          <div className="grid gap-4">
            {stats.upcomingShipments.map((shipment: any) => (
              <Card key={shipment.id} className="border-blue-100 hover:shadow-md transition-shadow group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900">
                            {shipment.origin_city} → {shipment.destination_city}
                          </h3>
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(shipment.departure_date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {shipment.weight_tonnes}t load</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100/50">
                        {shipment.goods_description}
                      </p>
                    </div>
                    <div className="md:w-48 bg-blue-50/30 p-6 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-blue-50">
                      <Link to={`/shipper/shipments/${shipment.id}`} className="w-full">
                        <Button className="w-full bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          Details
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCancelShipment(shipment.id)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        Cancel Load
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {!loading && stats.upcomingShipments.length === 0 && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No upcoming shipments</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            You don't have any active loads posted. Start by creating a new shipment request.
          </p>
          <Link to="/shipper/post-shipment" className="inline-block mt-8">
            <Button className="bg-orange-600 hover:bg-orange-700 shadow-md">
              Create My First Shipment
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ShipperDashboard;