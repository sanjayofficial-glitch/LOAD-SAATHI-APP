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
import { 
  Package, 
  Clock, 
  CheckCircle,
  IndianRupee,
  Truck,
  Phone,
  Loader2,
  Search
} from 'lucide-react';

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['shipper-requests', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('id, goods_description, weight_tonnes, status, created_at, trip:trips(id, origin_city, destination_city, price_per_tonne, trucker:users(id, full_name, phone))')
        .eq('shipper_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as (Request & { trip: any })[];
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

  if (isLoading && requests.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-sm border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{requests.length}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{acceptedCount}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div></CardContent>
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
                  <Link to="/browse-trucks"><Button className="bg-orange-600 hover:bg-orange-700 mt-2">Find Trucks</Button></Link>
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
                            <a href={`tel:${request.trip.trucker.phone}`}><Button size="sm" className="bg-green-600 hover:bg-green-700"><Phone className="h-4 w-4 mr-1" /> Call</Button></a>
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
              <Link to="/browse-trucks"><Button className="w-full justify-start bg-orange-600 hover:bg-orange-700"><Search className="h-4 w-4 mr-2" /> Find Available Trucks</Button></Link>
              <Link to="/shipper/my-shipments"><Button className="w-full justify-start" variant="outline"><Package className="h-4 w-4 mr-2" /> View All Shipments</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;