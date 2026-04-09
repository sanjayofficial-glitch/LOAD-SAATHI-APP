import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase'; // ✅ Added import
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck,   Calendar,   IndianRupee, 
  Edit, 
  Trash2,
  Eye,
  CheckCircle2,
  Loader2,
  Send,
  Inbox,
  Clock,
  Phone,
  MessageSquare,
  ArrowRight,
  Check,
  X,
  Package} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import locationData from '@/data/locations.json';
import { Link } from 'react-router-dom'; // ✅ Added import

const MyTrips = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase(); // ✅ Use hook correctly
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'trips';

  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [sentOffers, setSentOffers] = useState<any[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      const supabase = await getAuthenticatedClient(); // ✅ Get client
      
      // 1. Fetch My Posted Trips using the new view
      const { data: trips } = await supabase
        .from('trucker_my_trips')
        .select('*')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 2. Fetch Sent Offers (Trucker -> Shipper's Load)
      const { data: sent } = await supabase
        .from('requests')
        .select('*')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 3. Fetch Incoming Bookings (Shipper -> Trucker's Trip)
      const { data: incoming } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      setMyTrips(trips || []);
      setSentOffers(sent || []);
      // Filter incoming bookings for trips owned by this trucker
      setIncomingBookings(incoming || []); // ✅ Simplified filtering

    } catch (err: any) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]); // ✅ Correct dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]); // ✅ Single dependency, no extra braces

  const handleCompleteTrip = async (tripId: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('trips')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', tripId);
      
      if (error) throw error;
      showSuccess('Trip marked as completed!');
      fetchData();
    } catch (err: any) {
      showError('Failed to complete trip');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      
      if (error) throw error;
      showSuccess('Trip deleted successfully');
      fetchData();
    } catch (err: any) {
      showError('Failed to delete trip');
    }
  };

  const handleBookingAction = async (requestId: string, status: 'accepted' | 'declined') => {
    setActionLoading(requestId);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId);
      if (error) throw error;
      showSuccess(`Booking ${status} successfully`);
      fetchData();
    } catch (err: any) {
      showError('Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trucker Hub</h1>
          <p className="text-gray-500">Manage your routes and bookings in one place</p>
        </div>
        <Link to="/trucker/post-trip">
          <Button className="bg-orange-600 hover:bg-orange-700 shadow-md">
            Post New Trip
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            My Trips {myTrips.length > 0 && <Badge className="ml-1 bg-orange-100 text-orange-700">{myTrips.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Offers {sentOffers.length > 0 && <Badge className="ml-1 bg-orange-100 text-orange-700">{sentOffers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Incoming Bookings {incomingBookings.length > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700">{incomingBookings.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* TAB: MY TRIPS */}
        <TabsContent value="trips">
          {myTrips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No trips posted yet</h3>
              <p className="text-gray-500 mb-6">Start earning by sharing your empty truck space</p>
              <Link to="/trucker/post-trip"><Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">Post Your First Trip</Button></Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {myTrips.map(trip => (
                <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {trip.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {trip.destination_city}
                          </div>
                          <Badge className={trip.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{trip.status.toUpperCase()}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-orange-600" />{new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="flex items-center"><Truck className="h-4 w-4 mr-2 text-blue-600" />{trip.vehicle_type}</div>
                          <div className="flex items-center font-semibold text-gray-900"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{trip.price_per_tonne.toLocaleString()} /t</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                        <Link to={`/trucker/trips/${trip.id}`}><Button variant="ghost" size="sm" className="hover:bg-orange-50"><Eye className="h-4 w-4 mr-2" />View</Button></Link>
                        {trip.status === 'active' && (  
                          <>  
                            <Link to={`/trucker/trips/${trip.id}/edit`}><Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4 mr-2" />Edit</Button></Link>  
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Delete</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your trip listing.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTrip(trip.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
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

        {/* TAB: SENT OFFERS */}
        <TabsContent value="sent">
          {sentOffers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No offers sent yet</h3>
              <p className="text-gray-500 mb-6">Browse shipments to find goods for your truck</p>
              <Link to="/trucker/browse-shipments"><Button className="bg-orange-600">Browse Shipments</Button></Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {sentOffers.map((request) => (
                <Card key={request.id} className="overflow-hidden border-orange-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {request.trip?.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 mx-2" /> {request.trip?.destination_city}
                          </div>
                          <Badge className={request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : request.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-orange-600" />Ready Date: {new Date(request.trip?.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center font-bold text-green-600"><IndianRupee className="h-4 w-4 mr-1" />Your Offer: {request.proposed_price_per_tonne?.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods</p>
                          <p className="text-sm text-gray-700">{request.trip?.goods_description} ({request.trip?.weight_tonnes}t)</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'pending' ? (
                          <>  
                            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => handleBookingAction(request.id, 'accepted')} disabled={!!actionLoading}>{actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}Accept</Button>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleBookingAction(request.id, 'declined')} disabled={!!actionLoading}><X className="h-4 w-4 mr-2" />Decline</Button>
                          </>  
                        ) : request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => navigate(`/chat/${request.id}`)}><MessageSquare className="h-4 w-4 mr-2" />Chat</Button>
                            <a href={`tel:${request.trip?.shipper?.phone}`} className="block"><Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button></a>
                          </div>
                        ) : (
                          <p className="text-center text-sm text-gray-400 italic">Booking declined</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: INCOMING BOOKINGS */}
        <TabsContent value="incoming">
          {incomingBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No incoming bookings</h3>
              <p className="text-gray-500">When shippers book your trips, they will appear here</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {incomingBookings.map((request) => (
                <Card key={request.id} className="overflow-hidden border-orange-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {request.trip?.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 mx-2" /> {request.trip?.destination_city}
                          </div>
                          <Badge className={request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : request.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-orange-600" />Trip Date: {new Date(request.trip?.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center font-bold text-green-600"><IndianRupee className="h-4 w-4 mr-1" />Price: {request.trip?.price_per_tonne?.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Shipper: {request.trip?.shipper?.full_name}</p>
                          <p className="text-sm text-gray-700">{request.trip?.goods_description} ({request.trip?.weight_tonnes}t)</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'pending' ? (
                          <>  
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleBookingAction(request.id, 'accepted')} disabled={!!actionLoading}>{actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}Accept</Button>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleBookingAction(request.id, 'declined')} disabled={!!actionLoading}><X className="h-4 w-4 mr-2" />Decline</Button>
                          </>  
                        ) : request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => navigate(`/chat/${request.id}`)}><MessageSquare className="h-4 w-4 mr-2" />Chat</Button>
                            <a href={`tel:${request.trip?.shipper?.phone}`} className="block"><Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button></a>
                          </div>
                        ) : (
                          <p className="text-center text-sm text-gray-400 italic">Booking declined</p>
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

export default MyTrips;