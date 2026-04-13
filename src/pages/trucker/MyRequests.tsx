"use client";

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  X,
  MessageSquare,
  Phone,
  Package,
  Calendar,
  Loader2,
  Inbox,
  ArrowRight,
  Send,
  Clock,
  IndianRupee,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import {
  notifyShipperOfRequestAccepted,
  notifyShipperOfRequestDeclined,
} from '@/utils/notifications';

// ─── Status Badge Helper ───────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────
const MyRequests = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'incoming';

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentOffers, setSentOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch Data ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      // 1. Incoming booking requests to this trucker's trips (shipper → trucker)
      // receiver_id on the requests table stores the trucker's user ID (set at insert time)
      const { data: incoming, error: incomingError } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips!requests_trip_id_fkey(*),
          shipper:users!requests_shipper_id_fkey(*)
        `)
        .eq('receiver_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;

      // 2. Offers this trucker sent to shippers' loads (trucker → shipper)
      const { data: sent, error: sentError } = await supabase
        .from('shipment_requests')
        .select(`
          *,
          shipment:shipments!inner(*, shipper:users(*))
        `)
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      setIncomingRequests(incoming || []);
      setSentOffers(sent || []);
    } catch (err: any) {
      showError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Accept / Decline incoming shipper request ────────────────────────────────
  const handleAction = async (request: any, status: 'accepted' | 'declined') => {
    setActionLoading(request.id);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', request.id);

      if (error) throw error;

      // Notify the shipper of the outcome
      if (status === 'accepted') {
        await notifyShipperOfRequestAccepted({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: request.trip?.origin_city,
          destinationCity: request.trip?.destination_city,
          requestId: request.id,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('✅ Request accepted! The shipper has been notified.');
      } else {
        await notifyShipperOfRequestDeclined({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: request.trip?.origin_city,
          destinationCity: request.trip?.destination_city,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('Request declined. The shipper has been notified.');
      }

      fetchData();
    } catch (err: any) {
      showError(`Failed to ${status} request`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');
  const historyIncoming = incomingRequests.filter(r => r.status !== 'pending');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Requests Hub</h1>
        <p className="text-gray-500 mt-1">Manage incoming bookings from shippers and track your sent offers</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="incoming" className="relative">
            Incoming
            {pendingIncoming.length > 0 && (
              <Badge className="ml-2 bg-orange-600 text-white text-xs">{pendingIncoming.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent Offers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: INCOMING REQUESTS (Shipper → Trucker) ────────────────────── */}
        <TabsContent value="incoming">
          {pendingIncoming.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No pending requests</h3>
              <p className="text-gray-500">When shippers book space on your trips, they'll appear here</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingIncoming.map((request) => (
                <Card key={request.id} className="overflow-hidden border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Route + badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900">
                            {request.trip.origin_city}
                            <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                            {request.trip.destination_city}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>

                        {/* Details row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                            Trip: {new Date(request.trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-blue-500" />
                            {request.weight_tonnes}t — {request.goods_description}
                          </div>
                          {request.pickup_address && (
                            <div className="sm:col-span-2 text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                              📍 Pickup: {request.pickup_address}
                            </div>
                          )}
                        </div>

                        {/* Shipper card */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-orange-200 font-bold text-orange-600 text-sm">
                              {request.shipper?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{request.shipper?.full_name}</p>
                              {request.shipper?.phone && (
                                <p className="text-xs text-gray-500">{request.shipper.phone}</p>
                              )}
                            </div>
                          </div>
                          {request.goods_description && (
                            <p className="text-sm text-gray-600 italic mt-2">"{request.goods_description}"</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        <Button
                          className="bg-green-600 hover:bg-green-700 shadow-sm"
                          onClick={() => handleAction(request, 'accepted')}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === request.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><Check className="h-4 w-4 mr-2" />Accept</>}
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleAction(request, 'declined')}
                          disabled={!!actionLoading}
                        >
                          <X className="h-4 w-4 mr-2" />Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: SENT OFFERS (Trucker → Shipper) ──────────────────────────── */}
        <TabsContent value="sent">
          {sentOffers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No offers sent yet</h3>
              <p className="text-gray-500 mb-6">Browse available shipments to find loads for your truck</p>
              <Button onClick={() => navigate('/trucker/browse-shipments')} className="bg-orange-600 hover:bg-orange-700">
                Find Shipments
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {sentOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900">
                            {offer.shipment.origin_city}
                            <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                            {offer.shipment.destination_city}
                          </div>
                          <StatusBadge status={offer.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                            Ready: {new Date(offer.shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center font-bold text-green-700">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Your Offer: {offer.proposed_price_per_tonne?.toLocaleString()} /t
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Package className="h-4 w-4 mr-1" />
                            {offer.shipment.weight_tonnes}t — {offer.shipment.goods_description}
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-0.5">Shipper</p>
                          <p className="text-sm font-semibold text-gray-800">{offer.shipment.shipper?.full_name}</p>
                          {offer.message && <p className="text-xs text-gray-500 mt-1 italic">"{offer.message}"</p>}
                        </div>
                      </div>

                      {/* Status / Action area */}
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {offer.status === 'accepted' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium mb-2">
                              <CheckCircle className="h-4 w-4" /> Offer Accepted!
                            </div>
                            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => navigate(`/chat/${offer.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />Chat
                            </Button>
                            {offer.shipment.shipper?.phone && (
                              <a href={`tel:${offer.shipment.shipper.phone}`} className="block">
                                <Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button>
                              </a>
                            )}
                          </div>
                        ) : offer.status === 'declined' ? (
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                            <p className="text-xs text-red-600 font-medium">Offer Declined</p>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Waiting for shipper's response</p>
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

        {/* ── TAB 3: HISTORY (Accepted / Declined incoming) ───────────────────── */}
        <TabsContent value="history">
          {historyIncoming.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No request history yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {historyIncoming.map((request) => (
                <Card key={request.id} className="border-gray-100 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${request.status === 'accepted' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {request.status === 'accepted'
                            ? <Check className="h-4 w-4 text-green-600" />
                            : <X className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {request.shipper?.full_name} · {request.weight_tonnes}t
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.trip?.origin_city} → {request.trip?.destination_city} · {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 italic">{request.goods_description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'accepted' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${request.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />Chat
                            </Button>
                            {request.shipper?.phone && (
                              <a href={`tel:${request.shipper.phone}`}>
                                <Button size="sm" variant="ghost"><Phone className="h-4 w-4" /></Button>
                              </a>
                            )}
                          </>
                        )}
                        <StatusBadge status={request.status} />
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

export default MyRequests;