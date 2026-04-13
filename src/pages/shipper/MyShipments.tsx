"use client";

import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Calendar,
  IndianRupee,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Send,
  Inbox,
  Clock,
  Phone,
  MessageSquare,
  ArrowRight,
  Check,
  X,
  CheckCircle,
  XCircle,
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
import {
  notifyTruckerOfOfferAccepted,
  notifyTruckerOfOfferDeclined,
} from '@/utils/notifications';

// ─── Status Badge Helper ───────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    matched: 'bg-green-100 text-green-700 border-green-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────
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

  // ── Fetch Data ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      // 1. My Posted Loads (shipments)
      const { data: loads } = await supabase
        .from('shipments')
        .select('*')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 2. Requests I sent to truckers' trips (shipper → trucker)
      const { data: sent } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips(*, trucker:users(*))
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 3. Offers truckers sent to my loads (trucker → shipper)
      // Filter directly: only offers on shipments that belong to this shipper
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
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Delete Shipment ──────────────────────────────────────────────────────────
  const handleDeleteShipment = async (shipmentId: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from('shipments').delete().eq('id', shipmentId);
      if (error) throw error;
      showSuccess('Shipment deleted successfully');
      fetchData();
    } catch (err: any) {
      showError('Failed to delete shipment');
    }
  };

  // ── Accept / Decline incoming trucker offer ──────────────────────────────────
  const handleOfferAction = async (request: any, status: 'accepted' | 'declined') => {
    setActionLoading(request.id);
    try {
      const supabase = await getAuthenticatedClient();

      if (status === 'accepted') {
        // 1. Mark this offer as accepted
        const { error: acceptError } = await supabase
          .from('shipment_requests')
          .update({ status: 'accepted' })
          .eq('id', request.id);
        if (acceptError) throw acceptError;

        // 2. Auto-decline all other pending offers for the same shipment
        await supabase
          .from('shipment_requests')
          .update({ status: 'declined' })
          .eq('shipment_id', request.shipment_id)
          .eq('status', 'pending')
          .neq('id', request.id);

        // 3. Mark the shipment as matched (booked)
        await supabase
          .from('shipments')
          .update({ status: 'matched' })
          .eq('id', request.shipment_id);

        // 4. Notify the trucker
        await notifyTruckerOfOfferAccepted({
          truckerId: request.trucker_id,
          shipperName: userProfile?.full_name || 'The shipper',
          originCity: request.shipment?.origin_city,
          destinationCity: request.shipment?.destination_city,
          requestId: request.id,
          getToken: () => getToken({ template: 'supabase' }),
        });

        showSuccess('✅ Offer accepted! The trucker has been notified. You can now chat directly.');
      } else {
        const { error: declineError } = await supabase
          .from('shipment_requests')
          .update({ status: 'declined' })
          .eq('id', request.id);
        if (declineError) throw declineError;

        // Notify the trucker of the decline
        await notifyTruckerOfOfferDeclined({
          truckerId: request.trucker_id,
          shipperName: userProfile?.full_name || 'The shipper',
          originCity: request.shipment?.origin_city,
          destinationCity: request.shipment?.destination_city,
          getToken: () => getToken({ template: 'supabase' }),
        });

        showSuccess('Offer declined. The trucker has been notified.');
      }

      fetchData();
    } catch (err: any) {
      showError(`Failed to ${status} offer`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  const pendingIncomingOffers = incomingOffers.filter(r => r.status === 'pending');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipper Hub</h1>
          <p className="text-gray-500 mt-1">Manage your loads, sent requests, and incoming offers</p>
        </div>
        <Link to="/shipper/post-shipment">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">Post New Shipment</Button>
        </Link>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="loads" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Loads
            {myLoads.length > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700">{myLoads.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Requests
            {sentRequests.length > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700">{sentRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2 relative">
            <Inbox className="h-4 w-4" />
            Offers Received
            {pendingIncomingOffers.length > 0 && (
              <Badge className="ml-1 bg-orange-600 text-white">{pendingIncomingOffers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: MY LOADS ─────────────────────────────────────────────────── */}
        <TabsContent value="loads">
          {myLoads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No shipments posted yet</h3>
              <p className="text-gray-500 mb-6">Start by posting your first shipment to find truckers</p>
              <Link to="/shipper/post-shipment">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Post Your First Shipment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {myLoads.map(shipment => (
                <Card key={shipment.id} className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {shipment.origin_city}
                            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                            {shipment.destination_city}
                          </div>
                          <StatusBadge status={shipment.status} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            {new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-purple-500" />
                            {shipment.weight_tonnes}t
                          </div>
                          <div className="flex items-center font-semibold text-gray-800">
                            <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                            {shipment.budget_per_tonne?.toLocaleString()} /t
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{shipment.goods_description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                        <Link to={`/shipper/shipments/${shipment.id}`}>
                          <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                            <Eye className="h-4 w-4 mr-2" />View
                          </Button>
                        </Link>
                        {shipment.status === 'pending' && (
                          <>
                            <Link to={`/shipper/shipments/${shipment.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                                <Edit className="h-4 w-4 mr-2" />Edit
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4 mr-2" />Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this shipment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete your shipment listing and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteShipment(shipment.id)}
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

        {/* ── TAB 2: SENT REQUESTS (Shipper → Trucker's trip) ─────────────────── */}
        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No requests sent yet</h3>
              <p className="text-gray-500 mb-6">Browse available trucks to find space for your goods</p>
              <Link to="/browse-trucks">
                <Button className="bg-blue-600 hover:bg-blue-700">Find Trucks</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {sentRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {request.trip?.origin_city}
                            <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                            {request.trip?.destination_city}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            Departure: {new Date(request.trip?.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center font-bold text-green-700">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {request.trip?.price_per_tonne?.toLocaleString()} /t
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Package className="h-4 w-4 mr-1" />
                            {request.goods_description} ({request.weight_tonnes}t)
                          </div>
                        </div>

                        {/* Trucker info */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Trucker</p>
                          <p className="text-sm font-semibold text-gray-800">{request.trip?.trucker?.full_name || 'Unknown'}</p>
                          {request.trip?.trucker?.phone && (
                            <p className="text-xs text-gray-500">{request.trip.trucker.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Status / Contact area */}
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium mb-1">
                              <CheckCircle className="h-4 w-4" /> Request Accepted!
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${request.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />Chat
                            </Button>
                            {request.trip?.trucker?.phone && (
                              <a href={`tel:${request.trip.trucker.phone}`} className="block">
                                <Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button>
                              </a>
                            )}
                          </div>
                        ) : request.status === 'declined' ? (
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                            <p className="text-xs text-red-600 font-medium">Request Declined</p>
                            <p className="text-xs text-gray-400 mt-1">Browse other trucks</p>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Waiting for trucker's response</p>
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

        {/* ── TAB 3: INCOMING OFFERS (Trucker → Shipper's load) ───────────────── */}
        <TabsContent value="incoming">
          {incomingOffers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No offers received yet</h3>
              <p className="text-gray-500">When truckers offer to carry your loads, they will appear here</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {incomingOffers.map((request) => (
                <Card key={request.id} className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {request.shipment?.origin_city}
                            <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                            {request.shipment?.destination_city}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            Ready: {new Date(request.shipment?.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center font-bold text-orange-700">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Trucker's Offer: {request.proposed_price_per_tonne?.toLocaleString()} /t
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            Budget: ₹{request.shipment?.budget_per_tonne?.toLocaleString()} /t
                          </div>
                        </div>

                        {/* Trucker info */}
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-orange-200 font-bold text-orange-600 text-sm">
                              {request.trucker?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold">Trucker</p>
                              <p className="text-sm font-semibold text-gray-800">{request.trucker?.full_name}</p>
                              {request.trucker?.phone && (
                                <p className="text-xs text-gray-400">{request.trucker.phone}</p>
                              )}
                            </div>
                          </div>
                          {request.message && (
                            <p className="text-sm text-gray-600 italic mt-2">"{request.message}"</p>
                          )}
                        </div>
                      </div>

                      {/* Accept / Decline / Contact area */}
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'pending' ? (
                          <>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleOfferAction(request, 'accepted')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === request.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <><Check className="h-4 w-4 mr-2" />Accept</>}
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleOfferAction(request, 'declined')}
                              disabled={!!actionLoading}
                            >
                              <X className="h-4 w-4 mr-2" />Decline
                            </Button>
                          </>
                        ) : request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium mb-1">
                              <CheckCircle className="h-4 w-4" /> Offer Accepted!
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${request.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />Chat
                            </Button>
                            {request.trucker?.phone && (
                              <a href={`tel:${request.trucker.phone}`} className="block">
                                <Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                            <p className="text-xs text-red-600 font-medium">Offer Declined</p>
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

export default MyShipments;