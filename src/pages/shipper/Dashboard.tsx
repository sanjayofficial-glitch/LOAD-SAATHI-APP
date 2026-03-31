"use client";

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Request } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import ReviewDialog from '@/components/ReviewDialog';
import { 
  Package, 
  Clock, 
  CheckCircle,
  IndianRupee,
  Truck,
  Phone,
  Loader2,
  Search,
  PlusSquare,
  Star as StarIcon} from 'lucide-react';
import Star from '@/components/Star';

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const [reviewTarget, setReviewTarget] = useState<{
    tripId: string;
    truckerId: string;
    truckerName: string;
    requestId: string;
  } | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['shipper-requests', userProfile?.id],
    queryFn: async () => {
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('shipper_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (requestError) throw requestError;
      if (!requestData || requestData.length === 0) return [];

      const tripIds = [...new Set(requestData.map(r => r.trip_id))];
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds);

      if (tripError) throw tripError;

      const truckerIds = [...new Set(tripData?.map(t => t.trucker_id) || [])];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', truckerIds);

      const userMap = (userData || []).reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
      }, {});

      const tripMap = (tripData || []).reduce((acc: any, trip: any) => {
        acc[trip.id] = {
          ...trip,
          trucker: userMap[trip.trucker_id]
        };
        return acc;
      }, {});

      return requestData.map(req => ({
        ...req,
        trip: tripMap[req.trip_id]
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
        .eq('shipper_id', userProfile?.id);
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

  const reviewedTripIds = useMemo(() => new Set(reviews.map(r => r.trip_id)), [reviews]);

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
          </CardHeader
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
            <StarIcon className="h-4 w-4 text-purple-600" />
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
                  {requests.map((request) => {
                    const isCompleted = request.trip?.status === 'completed';
                    const isAccepted = request.status === 'accepted';
                    const canReview = isAccepted && isCompleted && !reviewedTripIds.has(request.trip_id);
                    const alreadyReviewed = isAccepted && isCompleted && reviewedTripIds.has(request.trip_id);

                    return (
                      <div key={request.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-900">{request.goods_description}</p>
                            <p className="text-sm text-gray-500">
                              {request.weight_tonnes}t • {request.trip?.origin_city} → {request.trip?.destination_city}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={
                              request.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              request.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }>
                              {request.status.toUpperCase()}
                            </Badge>
                            {isCompleted && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200">COMPLETED</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <div className="text-xs text-gray-400">Requested: {new Date(request.created_at).toLocaleDateString('en-IN')}</div>
                          <div className="flex items-center space-x-2">
                            {canReview && (
                              <Button 
                                size="sm"                                 className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                onClick={() => setReviewTarget({
                                  tripId: request.trip_id,
                                  truckerId: request.trip.trucker_id,
                                  truckerName: request.trip.trucker.full_name,
                                  requestId: request.id                                })}
                              >
                                <StarIcon className="h-4 w-4 mr-1 fill-current" /> Rate Trucker
                              </Button>
                            )}
                            {alreadyReviewed && (
                              <Badge variant="outline" className="text-gray-400 border-gray-200">Reviewed</Badge>
                            )}
                            {isAccepted && request.trip?.trucker && (
                              <>
                                <Link to={`/chat/${request.id}`}>
                                  <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                                    Chat
                                  </Button>
                                </Link>
                                <a href={`tel:${request.trip.trucker.phone}`}>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-sm">
                                    <Phone className="h-4 w-4 mr-1" /> Call
                                  </Button>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                <span className="text-sm text-gray-600">Successful Shipments</span>
                <span className="font-bold">{acceptedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Trips</span>
                <span className="font-bold">{acceptedCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {reviewTarget && userProfile && (
        <ReviewDialog
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          tripId={reviewTarget.tripId}
          truckerId={reviewTarget.truckerId}
          shipperId={userProfile.id}
          truckerName={reviewTarget.truckerName}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['shipper-reviews'] })}
        />
      )}
    </div>
  );
};

export default ShipperDashboard;