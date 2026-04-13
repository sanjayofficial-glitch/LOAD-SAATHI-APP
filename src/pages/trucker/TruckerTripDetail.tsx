"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck, MapPin, Calendar, IndianRupee, ArrowLeft, ArrowRight,
  Edit, Package, Check, X, Loader2, User, Star,
  CheckCircle, Clock, XCircle, Users,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import RouteMap from '@/components/RouteMap';
import {
  notifyShipperOfRequestAccepted,
  notifyShipperOfRequestDeclined,
} from '@/utils/notifications';

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────
const TruckerTripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<any>(null);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tripId || !userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      // Fetch trip (must belong to this trucker)
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*, trucker:users!trips_trucker_id_fkey(*)')
        .eq('id', tripId)
        .eq('trucker_id', userProfile.id)
        .single();

      if (tripError || !tripData) {
        showError('Trip not found or you are not the owner');
        navigate('/trucker/my-trips');
        return;
      }
      setTrip(tripData);

      // Fetch booking requests for this trip
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*, shipper:users!requests_shipper_id_fkey(*)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!requestsError) setBookingRequests(requests || []);
    } catch (err: any) {
      showError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  }, [tripId, userProfile?.id, getAuthenticatedClient, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBookingAction = async (request: any, status: 'accepted' | 'declined') => {
    setActionLoading(request.id);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', request.id);

      if (error) throw error;

      if (status === 'accepted') {
        await notifyShipperOfRequestAccepted({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: trip?.origin_city,
          destinationCity: trip?.destination_city,
          requestId: request.id,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('✅ Request accepted! Shipper has been notified.');
      } else {
        await notifyShipperOfRequestDeclined({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: trip?.origin_city,
          destinationCity: trip?.destination_city,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('Request declined. Shipper has been notified.');
      }
      fetchData();
    } catch (err: any) {
      showError(`Failed to ${status} request`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  if (!trip) return null;

  const pendingCount = bookingRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/trucker/my-trips')} className="text-gray-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Trips
        </Button>
        {trip.status === 'active' && (
          <Link to={`/trucker/trips/${trip.id}/edit`}>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Edit className="mr-2 h-4 w-4" /> Edit Trip
            </Button>
          </Link>
        )}
      </div>

      {/* Route Map */}
      <div className="mb-8 rounded-2xl overflow-hidden">
        <RouteMap originCity={trip.origin_city} destinationCity={trip.destination_city} height="240px" />
      </div>

      {/* Trip Info Card */}
      <Card className="mb-8 border-orange-100 shadow-sm">
        <CardHeader className="bg-orange-50/60 border-b border-orange-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                {trip.origin_city}
                <ArrowRight className="h-4 w-4 text-gray-400" />
                {trip.destination_city}
              </span>
            </CardTitle>
            <StatusBadge status={trip.status} />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Departure</p>
              <div className="flex items-center font-medium text-gray-800">
                <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Capacity Available</p>
              <div className="flex items-center font-bold text-blue-600">
                <Package className="h-4 w-4 mr-2" />
                {trip.available_capacity_tonnes} Tonnes
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Price</p>
              <div className="flex items-center font-bold text-green-600 text-lg">
                <IndianRupee className="h-4 w-4 mr-1" />
                {trip.price_per_tonne.toLocaleString()} /t
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Vehicle</p>
              <div className="flex flex-col">
                <span className="flex items-center font-medium text-gray-800">
                  <Truck className="h-4 w-4 mr-2 text-gray-400" /> {trip.vehicle_type}
                </span>
                <span className="text-xs text-gray-400 ml-6">{trip.vehicle_number}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Requests Tabs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Booking Requests
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-orange-600 text-white">{pendingCount} pending</Badge>
            )}
          </h2>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="max-w-[360px]">
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>

          {(['pending', 'accepted', 'declined'] as const).map(tab => {
            const filtered = bookingRequests.filter(r => r.status === tab);
            return (
              <TabsContent key={tab} value={tab} className="mt-4">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No {tab} requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filtered.map(request => (
                      <Card key={request.id} className="border-orange-100 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Shipper info */}
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                                  {request.shipper?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                                    <User className="h-4 w-4 text-gray-400" />
                                    {request.shipper?.full_name}
                                  </p>
                                  {request.shipper?.phone && (
                                    <p className="text-xs text-gray-500">{request.shipper.phone}</p>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-yellow-500">
                                    <Star className="h-3 w-3" />
                                    {request.shipper?.rating?.toFixed(1) || '0.0'} Rating
                                  </div>
                                </div>
                              </div>

                              {/* Cargo details */}
                              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                                <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase">Goods</p>
                                  <p className="font-medium text-gray-800">{request.goods_description}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase">Weight</p>
                                  <p className="font-bold text-blue-600">{request.weight_tonnes} t</p>
                                </div>
                                {request.pickup_address && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Pickup</p>
                                    <p className="text-gray-700 text-xs">{request.pickup_address}</p>
                                  </div>
                                )}
                              </div>

                              <p className="text-xs text-gray-400">
                                Requested: {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            {/* Actions */}
                            {tab === 'pending' && (
                              <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                                <Button
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleBookingAction(request, 'accepted')}
                                  disabled={!!actionLoading}
                                >
                                  {actionLoading === request.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <><Check className="h-4 w-4 mr-2" />Accept</>}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleBookingAction(request, 'declined')}
                                  disabled={!!actionLoading}
                                >
                                  <X className="h-4 w-4 mr-2" />Decline
                                </Button>
                              </div>
                            )}
                            {tab === 'accepted' && (
                              <div className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle className="h-5 w-5" /> Accepted
                              </div>
                            )}
                            {tab === 'declined' && (
                              <div className="flex items-center gap-2 text-red-500 font-medium">
                                <XCircle className="h-5 w-5" /> Declined
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default TruckerTripDetail;
