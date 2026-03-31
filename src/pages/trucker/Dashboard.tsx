"use client";

import { useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trip, Request } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from '@/utils/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import { 
  Truck, 
  CheckCircle, 
  Clock,
  MessageSquare,
  Phone,
  Plus,
  Eye,
  Users,
  Loader2
} from 'lucide-react';
import Star from '@/components/Star';

const TruckerDashboard = () => {
  const { userProfile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trucker-trips', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('trucker_id', userProfile?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!userProfile?.id,
  });

  const tripIdsKey = useMemo(() => trips.map(t => t.id).sort().join(','), [trips]);

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['trucker-requests', userProfile?.id, tripIdsKey],
    queryFn: async () => {
      const tripIds = trips.map(t => t.id);
      if (tripIds.length === 0) return [];
      
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .in('trip_id', tripIds)
        .order('created_at', { ascending: false });
      
      if (requestError) throw requestError;
      if (!requestData || requestData.length === 0) return [];

      const shipperIds = [...new Set(requestData.map(r => r.shipper_id))];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', shipperIds);

      const userMap = (userData || []).reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
      }, {});

      const tripMap = trips.reduce((acc: any, trip: any) => {
        acc[trip.id] = trip;
        return acc;
      }, {});

      return requestData.map(req => ({
        ...req,
        trip: tripMap[req.trip_id],
        shipper: userMap[req.shipper_id]
      })) as Request[];
    },
    enabled: !!userProfile?.id && trips.length > 0,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['trucker-reviews', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('trucker_id', userProfile?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  useEffect(() => {
    if (!userProfile?.id) return;

    const channel = supabase
      .channel(`trucker_dashboard_realtime_${userProfile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['trucker-requests'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `trucker_id=eq.${userProfile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['trucker-trips'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `trucker_id=eq.${userProfile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['trucker-reviews'] });
        refreshProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, queryClient, refreshProfile]);

  const handleAcceptRequest = useCallback(async (request: Request) => {
    if (!request.trip) return;

    if (request.trip.available_capacity_tonnes < request.weight_tonnes) {
      showError('Not enough capacity left!');
      return;
    }

    queryClient.setQueryData(['trucker-requests', userProfile?.id, tripIdsKey], (old: Request[] | undefined) => {
      return old?.map(r => r.id === request.id ? { ...r, status: 'accepted' } : r);
    });

    const { error: requestError } = await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', request.id);

    if (requestError) {
      showError('Failed to accept request');
      queryClient.invalidateQueries({ queryKey: ['trucker-requests'] });
      return;
    }

    showSuccess('Request accepted!');
    queryClient.invalidateQueries({ queryKey: ['trucker-requests'] });
    queryClient.invalidateQueries({ queryKey: ['trucker-trips'] });
  }, [queryClient, userProfile?.id, tripIdsKey]);

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    queryClient.setQueryData(['trucker-requests', userProfile?.id, tripIdsKey], (old: Request[] | undefined) => {
      return old?.map(r => r.id === requestId ? { ...r, status: 'declined' } : r);
    });

    const { error } = await supabase
      .from('requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) {
      showError('Failed to decline');
      queryClient.invalidateQueries({ queryKey: ['trucker-requests'] });
    } else {
      showSuccess('Request declined');
    }
  }, [queryClient, userProfile?.id, tripIdsKey]);

  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const acceptedRequests = useMemo(() => requests.filter(r => r.status === 'accepted'), [requests]);
  const activeTrips = useMemo(() => trips.filter(t => t.status === 'active'), [trips]);
  const completedTrips = useMemo(() => trips.filter(t => t.status === 'completed'), [trips]);

  if (tripsLoading && trips.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {userProfile?.full_name}!</h1>
          <p className="text-gray-600 mt-2">Real-time trip management</p>
        </div>
        {(tripsLoading || requestsLoading) && (
          <div className="flex items-center text-xs text-orange-600 animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Syncing...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="border-orange-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Trips</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeTrips.length}</div></CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingRequests.length}</div></CardContent>
        </Card>
        <Card className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{completedTrips.length}</div></CardContent>
        </Card>
        <Card className="border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rating</CardTitle>
            <Star filled className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{userProfile?.rating?.toFixed(1) || '0.0'}</div></CardContent>
        </Card>
        <Card className="border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Reviews</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{reviews.length}</div></CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({acceptedRequests.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                  <Clock className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">No pending requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg">{request.goods_description}</p>
                        <p className="text-sm text-gray-500">
                          {request.weight_tonnes}t • {request.trip?.origin_city} → {request.trip?.destination_city}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="text-sm text-gray-600">Shipper: <span className="font-medium">{request.shipper?.full_name}</span></div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleDeclineRequest(request.id)} className="text-red-600 hover:bg-red-50">Decline</Button>
                        <Button size="sm" onClick={() => handleAcceptRequest(request)} className="bg-green-600 hover:bg-green-700">Accept</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {acceptedRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                  <CheckCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">No active bookings</p>
                </div>
              ) : (
                acceptedRequests.map((request) => (
                  <div key={request.id} className="border rounded-xl p-4 bg-orange-50/30 border-orange-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg">{request.goods_description}</p>
                        <p className="text-sm text-gray-500">
                          {request.weight_tonnes}t • {request.trip?.origin_city} → {request.trip?.destination_city}
                        </p>
                      </div>
                      <Badge className="bg-green-600">Accepted</Badge>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-orange-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2"><Users className="h-4 w-4 text-orange-600" /></div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{request.shipper?.full_name}</p>
                          <p className="text-xs text-gray-500">{request.shipper?.phone}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/chat/${request.id}`}><Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100"><MessageSquare className="h-4 w-4 mr-1" /> Chat</Button></Link>
                        <a href={`tel:${request.shipper?.phone}`}><Button size="sm" className="bg-orange-600 hover:bg-orange-700"><Phone className="h-4 w-4 mr-1" /> Call</Button></a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link to="/trucker/post-trip"><Button className="w-full justify-start bg-orange-600 hover:bg-orange-700 shadow-sm hover:shadow-md transition-all"><Plus className="h-4 w-4 mr-2" /> Post New Trip</Button></Link>
              <Link to="/trucker/my-trips"><Button className="w-full justify-start" variant="outline"><Eye className="h-4 w-4 mr-2" /> View All Trips</Button></Link>
              <Link to="/profile"><Button className="w-full justify-start" variant="outline"><Users className="h-4 w-4 mr-2" /> Edit Profile</Button></Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Your Performance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Rating</span>
                <div className="flex items-center">
                  <Star filled className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="font-bold">{userProfile?.rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Reviews</span>
                <span className="font-bold">{reviews.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Trips</span>
                <span className="font-bold">{completedTrips.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TruckerDashboard;