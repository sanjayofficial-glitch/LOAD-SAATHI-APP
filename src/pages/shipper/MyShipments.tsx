"use client";

import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Calendar, 
  IndianRupee, 
  Loader2, 
  ArrowRight,
  Eye,
  Trash2,
  Edit,
  Inbox,
  Send,
  MessageSquare,
  Phone,
  Check,
  X,
  User,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from '@/utils/toast';
import { notifyTruckerOfOfferAccepted, notifyTruckerOfOfferDeclined } from '@/utils/notifications';

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    matched: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const MyShipments = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'loads';

  const [myLoads, setMyLoads] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      // 1. My Posted Loads
      const { data: loads } = await supabase
        .from('shipments')
        .select('*')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 2. Requests I sent to Truckers (Shipper -> Trucker)
      const { data: sent } = await supabase
        .from('requests')
        .select(`*, trip:trips(*, trucker:users(*))`)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 3. Offers Truckers sent to my Loads (Trucker -> Shipper)
      const { data: incoming } = await supabase
        .from('shipment_requests')
        .select(`
          *, 
          shipment:shipments!inner(*), 
          trucker:users!shipment_requests_trucker_id_fkey(*)
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      setMyLoads(loads || []);
      setSentRequests(sent || []);
      setIncomingOffers(incoming || []);
    } catch (err: any) {
      console.error('[MyShipments] Error:', err);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteShipment = async (id: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Shipment deleted');
      loadData();
    } catch (err) {
      showError('Failed to delete');
    }
  };

  const handleOfferAction = async (offer: any, status: 'accepted' | 'declined') => {
    setActionLoading(offer.id);
    try {
      const supabase = await getAuthenticatedClient();
      
      // 1. Update offer status
      const { error: offerError } = await supabase
        .from('shipment_requests')
        .update({ status })
        .eq('id', offer.id);

      if (offerError) throw offerError;

      // 2. If accepted, update shipment status to 'matched'
      if (status === 'accepted') {
        await supabase
          .from('shipments')
          .update({ status: 'matched' })
          .eq('id', offer.shipment_id);
          
        await notifyTruckerOfOfferAccepted({
          truckerId: offer.trucker_id,
          shipperName: userProfile?.full_name || 'The shipper',
          originCity: offer.shipment.origin_city,
          destinationCity: offer.shipment.destination_city,
          requestId: offer.id,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('✅ Offer accepted! Trucker has been notified.');
      } else {
        await notifyTruckerOfOfferDeclined({
          truckerId: offer.trucker_id,
          shipperName: userProfile?.full_name || 'The shipper',
          originCity: offer.shipment.origin_city,
          destinationCity: offer.shipment.destination_city,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('Offer declined.');
      }
      
      loadData();
    } catch (err: any) {
      showError(`Failed to ${status} offer`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  const pendingIncoming = incomingOffers.filter(o => o.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Shipments</h1>
        <p className="text-gray-500">Manage your posted loads and booking requests</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="loads" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Loads
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Requests
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2 relative">
            <Inbox className="h-4 w-4" />
            Incoming Offers
            {pendingIncoming.length > 0 && (
              <Badge className="ml-1 bg-blue-600 text-white">{pendingIncoming.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loads">
          <div className="grid gap-6">
            {myLoads.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">You haven't posted any shipments yet.</p>
                <Link to="/shipper/post-shipment" className="mt-4 inline-block">
                  <Button className="bg-blue-600">Post New Shipment</Button>
                </Link>
              </div>
            ) : (
              myLoads.map(shipment => (
                <Card key={shipment.id} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-bold text-gray-900">
                            {shipment.origin_city} <ArrowRight className="h-4 w-4 inline mx-2 text-gray-400" /> {shipment.destination_city}
                          </div>
                          <StatusBadge status={shipment.status} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-500">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />{new Date(shipment.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-purple-600" />{shipment.weight_tonnes}t</div>
                          <div className="flex items-center font-semibold text-gray-800"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{shipment.budget_per_tonne.toLocaleString()} /t</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/shipper/shipments/${shipment.id}`}>
                          <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50"><Eye className="h-4 w-4 mr-2" />View</Button>
                        </Link>
                        {shipment.status === 'pending' && (
                          <>
                            <Link to={`/shipper/shipments/${shipment.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4 mr-2" />Edit</Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this shipment?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete your shipment listing.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteShipment(shipment.id)} className="bg-red-600">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="grid gap-6">
            {sentRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">You haven't sent any booking requests to truckers yet.</p>
                <Link to="/browse-trucks" className="mt-4 inline-block">
                  <Button className="bg-blue-600">Find Trucks</Button>
                </Link>
              </div>
            ) : (
              sentRequests.map(request => (
                <Card key={request.id} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-gray-900">
                            {request.trip?.origin_city} <ArrowRight className="h-4 w-4 inline mx-2 text-gray-400" /> {request.trip?.destination_city}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />Trip Date: {new Date(request.trip?.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-purple-600" />Your Load: {request.weight_tonnes}t</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {request.trip?.trucker?.full_name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Trucker</p>
                            <p className="text-sm font-semibold">{request.trip?.trucker?.full_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'accepted' && (
                          <>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${request.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />Chat
                            </Button>
                            {request.trip?.trucker?.phone && (
                              <a href={`tel:${request.trip.trucker.phone}`} className="block">
                                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"><Phone className="h-4 w-4 mr-2" />Call</Button>
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="incoming">
          <div className="grid gap-6">
            {incomingOffers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No truckers have sent offers for your loads yet.</p>
              </div>
            ) : (
              incomingOffers.map(offer => (
                <Card key={offer.id} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-gray-900">
                            {offer.shipment?.origin_city} <ArrowRight className="h-4 w-4 inline mx-2 text-gray-400" /> {offer.shipment?.destination_city}
                          </div>
                          <StatusBadge status={offer.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center font-bold text-green-700">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Offer: {offer.proposed_price_per_tonne?.toLocaleString()} /t
                          </div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-purple-600" />Load: {offer.shipment?.weight_tonnes}t</div>
                        </div>
                        {offer.message && (
                          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 italic">
                            "{offer.message}"
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                            <Truck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Trucker</p>
                            <p className="font-semibold">{offer.trucker?.full_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {offer.status === 'pending' ? (
                          <>
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700" 
                              onClick={() => handleOfferAction(offer, 'accepted')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />Accept Offer</>}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleOfferAction(offer, 'declined')}
                              disabled={!!actionLoading}
                            >
                              <X className="h-4 w-4 mr-2" />Decline
                            </Button>
                          </>
                        ) : offer.status === 'accepted' ? (
                          <>
                            <div className="flex items-center justify-center gap-2 text-green-600 font-bold mb-2">
                              <CheckCircle className="h-5 w-5" /> Accepted
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${offer.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />Chat
                            </Button>
                            {offer.trucker?.phone && (
                              <a href={`tel:${offer.trucker.phone}`} className="block">
                                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"><Phone className="h-4 w-4 mr-2" />Call</Button>
                              </a>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-red-500 font-bold">
                            <XCircle className="h-5 w-5" /> Declined
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyShipments;