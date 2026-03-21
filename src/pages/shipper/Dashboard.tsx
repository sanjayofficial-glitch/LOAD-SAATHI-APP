import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Request } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Calendar, 
  Truck, 
  Phone, 
  Clock, 
  CheckCircle,
  IndianRupee,
  User
} from 'lucide-react';

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<(Request & { trip: any })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!userProfile) return;
    
    const { data } = await supabase
      .from('requests')
      .select(`
        *,
        trip:trips(*)
      `)
      .eq('shipper_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRequests(data as (Request & { trip: any })[]);
    }
    setLoading(false);
  }, [userProfile]);

  useEffect(() => {
    fetchRequests();

    if (userProfile) {
      const channel = supabase
        .channel('shipper_dashboard_sync')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'requests',
          filter: `shipper_id=eq.${userProfile.id}`
        }, () => {
          fetchRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile, fetchRequests]);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Syncing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userProfile?.full_name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Your shipments are being tracked in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{acceptedRequests.reduce((sum, r) => sum + (r.weight_tonnes * r.trip?.price_per_tonne || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-gray-600 mb-4">Start by finding available trucks</p>
                  <Link to="/browse-trucks">
                    <Button className="bg-orange-600 hover:bg-orange-700">Find Trucks</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{request.goods_description}</p>
                          <p className="text-sm text-gray-500">
                            {request.weight_tonnes} tonnes • {request.trip?.origin_city} → {request.trip?.destination_city}
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          request.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                          request.status === 'accepted' ? 'bg-green-50 text-green-700' :
                          'bg-red-50 text-red-700'
                        }>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Requested: {new Date(request.created_at).toLocaleDateString('en-IN')}
                        </div>
                        {request.status === 'accepted' && request.trip?.trucker && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-green-600">
                              {request.trip.trucker.full_name}
                            </span>
                            <a href={`tel:${request.trip.trucker.phone}`}>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </Button>
                            </a>
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
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/browse-trucks">
                <Button className="w-full justify-start" variant="outline">
                  <Truck className="h-4 w-4 mr-2" />
                  Find Available Trucks
                </Button>
              </Link>
              <Link to="/shipper/my-shipments">
                <Button className="w-full justify-start" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  View All Shipments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;