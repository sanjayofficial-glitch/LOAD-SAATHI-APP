import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip, Request } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/utils/toast';
import { 
  Truck, 
  Calendar, 
  IndianRupee, 
  Users, 
  Plus, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Star
} from 'lucide-react';

const TruckerDashboard = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userProfile) return;

    const { data: tripsData } = await supabase
      .from('trips')
      .select('*, trucker:users(*)')
      .eq('trucker_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (tripsData) {
      setTrips(tripsData as Trip[]);
    }

    const { data: requestsData } = await supabase
      .from('requests')
      .select(`
        *,
        trip:trips(*),
        shipper:users(*)
      `)
      .in('trip_id', tripsData?.map(t => t.id) || [])
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requestsData) {
      setPendingRequests(requestsData as Request[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const handleAcceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      showError('Failed to accept request');
    } else {
      showSuccess('Request accepted!');
      fetchData();
      refreshProfile();
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) {
      showError('Failed to decline request');
    } else {
      showSuccess('Request declined');
      fetchData();
    }
  };

  const activeTrips = trips.filter(t => t.status === 'active');
  const completedTrips = trips.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
          Manage your trips and requests
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Trips</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrips.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Trips</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTrips.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile?.rating?.toFixed(1) || '0.0'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{request.goods_description}</p>
                          <p className="text-sm text-gray-500">
                            {request.weight_tonnes} tonnes • {request.pickup_address} → {request.delivery_address}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Trip: {request.trip?.origin_city} → {request.trip?.destination_city}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Pending
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Shipper: {request.shipper?.full_name} ({request.shipper?.phone})
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
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
              <Link to="/trucker/post-trip">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Trip
                </Button>
              </Link>
              <Link to="/trucker/my-trips">
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Trips
                </Button>
              </Link>
              <Link to="/profile">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TruckerDashboard;