"use client";

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip, Request } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from '@/utils/toast';
import { 
  Truck, 
  CheckCircle, 
  XCircle,
  Clock,
  Star,
  MessageSquare,
  Phone,
  Plus,
  Eye,
  Users
} from 'lucide-react';

const TruckerDashboard = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (showLoading = false) => {
    if (!userProfile) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);

    try {
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (tripsError) throw tripsError;

      if (tripsData) {
        setTrips(tripsData as Trip[]);
        
        const tripIds = tripsData.map(t => t.id);
        if (tripIds.length > 0) {
          const { data: requestsData, error: reqsError } = await supabase
            .from('requests')
            .select(`
              *,
              trip:trips(*),
              shipper:users(*)
            `)
            .in('trip_id', tripIds)
            .order('created_at', { ascending: false });

          if (reqsError) throw reqsError;

          if (requestsData) {
            const reqs = requestsData as Request[];
            setPendingRequests(reqs.filter(r => r.status === 'pending'));
            setAcceptedRequests(reqs.filter(r => r.status === 'accepted'));
          }
        } else {
          setPendingRequests([]);
          setAcceptedRequests([]);
        }
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      fetchData(true);

      const channel = supabase
        .channel(`trucker_dashboard_${userProfile.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'requests'
        }, () => {
          fetchData(false);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `trucker_id=eq.${userProfile.id}`
        }, () => {
          fetchData(false);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [userProfile, fetchData]);

  const handleAcceptRequest = async (request: Request) => {
    if (!request.trip) return;

    const newCapacity = request.trip.available_capacity_tonnes - request.weight_tonnes;
    
    if (newCapacity < 0) {
      showError('Not enough capacity left in this trip!');
      return;
    }

    const { error: requestError } = await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', request.id);

    if (requestError) {
      showError('Failed to accept request');
      return;
    }

    const { error: tripError } = await supabase
      .from('trips')
      .update({ available_capacity_tonnes: newCapacity })
      .eq('id', request.trip_id);

    if (tripError) {
      showError('Failed to update trip capacity');
    } else {
      showSuccess('Request accepted!');
      fetchData(false);
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
      fetchData(false);
    }
  };

  const activeTrips = trips.filter(t => t.status === 'active');
  const completedTrips = trips.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
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
          Manage your trips and requests in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Trips</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrips.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Trips</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTrips.length}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-100">
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
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pending">Pending Requests ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="active">Active Bookings ({acceptedRequests.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <Card>
                <CardContent className="pt-6">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500">No pending requests at the moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-lg">{request.goods_description}</p>
                              <p className="text-sm text-gray-500">
                                {request.weight_tonnes} tonnes • {request.trip?.origin_city} → {request.trip?.destination_city}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="text-sm text-gray-600">
                              Shipper: <span className="font-medium">{request.shipper?.full_name}</span>
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
                                onClick={() => handleAcceptRequest(request)}
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
            </TabsContent>

            <TabsContent value="active">
              <Card>
                <CardContent className="pt-6">
                  {acceptedRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500">No active bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {acceptedRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4 bg-orange-50/30 border-orange-100">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-lg">{request.goods_description}</p>
                              <p className="text-sm text-gray-600">
                                {request.weight_tonnes} tonnes • {request.trip?.origin_city} → {request.trip?.destination_city}
                              </p>
                            </div>
                            <Badge className="bg-green-600">Accepted</Badge>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-orange-100">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                                <Users className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{request.shipper?.full_name}</p>
                                <p className="text-xs text-gray-500">{request.shipper?.phone}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link to={`/chat/${request.id}`}>
                                <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Chat
                                </Button>
                              </Link>
                              <a href={`tel:${request.shipper?.phone}`}>
                                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                  <Phone className="h-4 w-4 mr-1" />
                                  Call
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/trucker/post-trip">
                <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white">
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