import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {   Truck, 
  MapPin, 
  Calendar,   IndianRupee, 
  ArrowLeft, 
  Loader2,
  CheckCircle, 
  AlertCircle,   Star, 
  PlusCircle,
  Filter,
  Eye,
  X,
  XCircle,
  MessageSquare,
  Phone,
  Users,
  Send,
  Inbox,
  ArrowRight,
  Package,
  Edit,
  Trash2,
  Check
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { showError, showSuccess } from '@/utils/toast';
import { notifyShipperOfRequestAccepted, notifyShipperOfRequestDeclined } from '@/utils/notifications';

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const TruckerDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'trips';

  const [trips, setTrips] = useState<any[]>([]);
  const [sentOffers, setSentOffers] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      // 1. My Posted Trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 2. Offers sent to shippers (trucker → shipper)
      const { data: sent } = await supabase
        .from('shipment_requests')
        .select(`
          *,
          shipment:shipments!inner(*, shipper:users(*))
        `)
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 3. Booking requests from shippers (shipper → trucker)
      const { data: incoming } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips!requests_trip_id_fkey(*),
          shipper:users!requests_shipper_id_fkey(*)
        `)
        .eq('receiver_id', userProfile.id)
        .order('created_at', { ascending: false });

      setTrips(tripsData || []);
      setSentOffers(sent || []);
      setIncomingRequests(incoming || []);
    } catch (err: any) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) throw error;
      showSuccess('Trip deleted successfully');
      fetchData();
    } catch (err: any) {
      showError('Failed to delete trip');
    }
  };

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
          originCity: request.trip?.origin_city,
          destinationCity: request.trip?.destination_city,
          requestId: request.id,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('✅ Request accepted!');
      } else {
        await notifyShipperOfRequestDeclined({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: request.trip?.origin_city,
          destinationCity: request.trip?.destination_city,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('Request declined.');
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

  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trucker Hub</h1>
          <p className="text-gray-500 mt-1">Manage your trips, sent offers, and incoming bookings</p>
        </div>
        <Link to="/trucker/post-trip">
          <Button className="bg-orange-600 hover:bg-orange-700 shadow-md">
            <PlusCircle className="mr-2 h-4 w-4" /> Post New Trip          </Button>
        </Link>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            My Trips
            {trips.length > 0 && <Badge className="ml-1 bg-orange-100 text-orange-700">{trips.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Offers
            {sentOffers.length > 0 && <Badge className="ml-1 bg-orange-100 text-orange-700">{sentOffers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2 relative">
            <Inbox className="h-4 w-4" />
            Booking Requests
            {pendingIncoming.length > 0 && (
              <Badge className="ml-1 bg-orange-600 text-white">{pendingIncoming.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: MY TRIPS --- */}
        <TabsContent value="trips">
          {trips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips posted yet</h3>
              <p className="text-gray-500 mb-6">Post a trip to start finding loads</p>
              <Link to="/trucker/post-trip">
                <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                  Post Your First Trip                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {trips.map(trip => (
                <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-100 p-3 rounded-full">
                            <Truck className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {trip.origin_city} <ArrowRight className="h-4 w-4 inline mx-1 text-gray-400" /> {trip.destination_city}
                            </h3>
                            <p className="text-sm text-gray-600">{trip.vehicle_type}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            <p className="text-gray-500 text-xs">
                              {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-blue-600" />
                            {trip.available_capacity_tonnes} tonnes
                          </div>
                          <div className="flex items-center font-semibold text-gray-800">
                            <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                            {trip.price_per_tonne?.toLocaleString()} /t
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                        <Link to={`/trucker/trips/${trip.id}`}>
                          <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </Link>
                        {trip.status === 'active' && (
                          <>
                            <Link to={`/trucker/trips/${trip.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete your trip listing.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTrip(trip.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* --- TAB 2: SENT OFFERS --- */}
        <TabsContent value="sent">
          {sentOffers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No offers sent yet</h3>
              <p className="text-gray-500 mb-6">Browse shipments to find loads for your truck</p>
              <Link to="/trucker/browse-shipments">
                <Button className="bg-orange-600 hover:bg-orange-700">Find Shipments</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {sentOffers.map(offer => (
                <Card key={offer.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900">
                            {offer.shipment.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 mx-2" /> {offer.shipment.destination_city}
                          </div>
                          <StatusBadge status={offer.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                            <p className="text-gray-500 text-xs">
                              Ready: {new Date(offer.shipment.departure_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center font-bold text-green-700">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {offer.proposed_price_per_tonne?.toLocaleString()} /t
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg text-sm flex justify-between">
                          <span className="text-gray-600">Total offer:</span>
                          <span className="font-bold text-orange-700">
                            ₹{(parseFloat(offer.proposed_price_per_tonne || 0) * (offer.shipment.weight_tonnes || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {offer.status === 'pending' ? (
                          <>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleBookingAction(offer, 'accepted')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === offer.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <><Check className="h-4 w-4 mr-2" /> Accept</>}
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleBookingAction(offer, 'declined')}
                              disabled={!!actionLoading}
                            >
                              <X className="h-4 w-4 mr-2" /> Decline
                            </Button>
                          </>
                        ) : offer.status === 'accepted' && (
                          <div className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle className="h-5 w-5" /> Accepted
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* --- TAB 3: BOOKING REQUESTS --- */}
        <TabsContent value="incoming">
          {incomingRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No booking requests</h3>
              <p className="text-gray-500">When shippers book space on your trips, they'll appear here</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {incomingRequests.map(request => (
                <Card key={request.id} className="overflow-hidden border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900">
                            {request.trip.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 mx-2" /> {request.trip.destination_city}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                            <p className="text-gray-500 text-xs">
                              Trip: {new Date(request.trip.departure_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-blue-500" />
                            {request.weight_tonnes} t — {request.goods_description}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                          <p className="text-xs text-gray-500 uppercase font-bold">Shipper</p>
                          <p className="font-semibold">{request.shipper?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'pending' ? (
                          <>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleBookingAction(request, 'accepted')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === request.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <><Check className="h-4 w-4 mr-2" /> Accept</>}
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleBookingAction(request, 'declined')}
                              disabled={!!actionLoading}
                            >
                              <X className="h-4 w-4 mr-2" /> Decline
                            </Button>
                          </>
                        ) : request.status === 'accepted' && (
                          <div className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle className="h-5 w-5" /> Accepted
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TruckerDashboard;