"use client";

import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Request } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import { 
  Package, 
  Clock, 
  CheckCircle,
  IndianRupee,
  Truck,
  Phone,
  Loader2,
  Search,
  PlusSquare
} from 'lucide-react';
import Star from '@/components/Star';

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['shipper-requests', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips(
            *,
            trucker:users(*)
          )
        `)
        .eq('shipper_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return (data as any[]).map(req => ({
        ...req,
        trip: Array.isArray(req.trip) ? {
          ...req.trip[0],
          trucker: Array.isArray(req.trip[0]?.trucker) ? req.trip[0].trucker[0] : req.trip[0]?.trucker
        } : {
          ...req.trip,
          trucker: Array.isArray(req.trip?.trucker) ? req.trip.trucker[0] : req.trip?.trucker
        }
      })) as Request[];
    },
    enabled: !!userProfile?.id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['shipper-reviews', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('shipper_id', userProfile?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  useEffect(() => {
    if (!userProfile?.id) return;

    const channel = supabase
      .channel(`shipper_dashboard_realtime_${userProfile.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'requests',
        filter: `shipper_id=eq.${userProfile.id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['shipper-requests'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, queryClient]);

  const pendingCount = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests]);
  const acceptedCount = useMemo(() => requests.filter(r => r.status === 'accepted').length, [requests]);
  const totalSpent = useMemo(() => 
    requests.filter(r => r.status === 'accepted')
      .reduce((sum, r) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0), 
  [requests]);

  const averageRatingGiven = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  if (isLoading && requests.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hello, {userProfile?.full_name}!</h1>
          <p className="text-gray-600 mt-2">Track your shipments in real-time</p>
        </div>
        {isLoading && (
          <div className="flex items-center text-xs text-orange-600 animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Syncing...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="shadow-sm border-orange-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{requests.length}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-yellow-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-green-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{acceptedCount}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-blue-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-purple-100 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Reviews Given</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{reviews.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Recent Requests</CardTitle></CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                  <div className="space-y-3">
                    <Link to="/shipper/post-shipment"><Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">Post Your Shipment</Button></Link>
                    <p className="text-sm text-gray-500">or</p>
                    <Link to="/browse-trucks"><Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">Find Available Trucks</Button></Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{request.goods_description}</p>
                          <p className="text-sm text-gray-500">
                            {request.weight_tonnes}t • {request.trip?.origin_city} → {request.trip?.destination_city}
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          request.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          request.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="text-xs text-gray-400">Requested: {new Date(request.created_at).toLocaleDateString('en-IN')}</div>
                        {request.status === 'accepted' && request.trip?.trucker && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-green-600">{request.trip.trucker.full_name}</span>
                            <a href={`tel:${request.trip.trucker.phone}`}><Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-sm"><Phone className="h-4 w-4 mr-1" /> Call</Button></a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link to="/shipper/post-shipment"><Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"><PlusSquare className="h-4 w-4 mr-2" /> Post Your Shipment</Button></Link>
              <Link to="/browse-trucks"><Button className="w-full justify-start" variant="outline"><Search className="h-4 w-4 mr-2" /> Find Available Trucks</Button></Link>
              <Link to="/shipper/my-shipments"><Button className="w-full justify-start" variant="outline"><Package className="h-4 w-4 mr-2" /> View All Shipments</Button></Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Your Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Reviews Given</span>
                <span className="font-bold">{reviews.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Rating Given</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" />
                  <span className="font-bold">{averageRatingGiven.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Successful Shipments</span>
                <span className="font-bold">{acceptedCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;