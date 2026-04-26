"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Calendar, 
  Package, 
  ArrowRight, 
  Loader2, 
  IndianRupee, 
  Filter, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  Plus, 
  Inbox, 
  MessageSquare, 
  Phone, 
  Check, 
  Trash2, 
  Eye, 
  Edit, 
  MapPin,
  Send,
  X
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
import { showSuccess, showError } from '@/utils/toast';
import {
  notifyTruckerOfOfferAccepted,
  notifyTruckerOfOfferDeclined,
} from '@/utils/notifications';
import { Skeleton } from '@/components/ui/skeleton';

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    matched: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
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

  const [shipments, setShipments] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      const { data: shipmentsData } = await supabase
        .from('shipments')
        .select('*')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      const { data: sent } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips!inner(*)
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      const { data: incoming } = await supabase
        .from('shipment_requests')
        .select(`
          *,
          shipment:shipments!inner(*),
          trucker:users!shipment_requests_trucker_id_fkey(*)
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      setShipments(shipmentsData || []);
      setSentRequests(sent || []);
      setIncomingOffers(incoming || []);
    } catch (err: any) {
      console.error('[MyShipments] Fetch error:', err);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteShipment = async (id: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Shipment deleted successfully');
      fetchData();
    } catch (err: any) {
      showError('Failed to delete shipment');
    }
  };

  const handleOfferAction = async (offer: any, status: 'accepted' | 'declined') => {
    setActionLoading(offer.id);
    try {
      const supabase = await getAuthenticatedClient();
      
      const { error } = await supabase
        .from('shipment_requests')
        .update({ status })
        .eq('id', offer.id);

      if (error) throw error;

      if (status === 'accepted') {
        await supabase
          .from('shipments')
          .update({ status: 'matched' })
          .eq('id', offer.shipment_id);

        await notifyTruckerOfOfferAccepted({
          truckerId: offer.trucker_id,
          shipperName: userProfile?.full_name || 'The shipper',
          shipperPhone: userProfile?.phone || 'N/A',
          originCity: offer.shipment?.origin_city,
          destinationCity: offer.shipment?.destination_city,
          requestId: offer.id,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('✅ Offer accepted!');
      } else {
        await notifyTruckerOfOfferDeclined({
          truckerId: offer.trucker_id,
          shipperName: userProfile?.full_name || 'The shipper',
          originCity: offer.shipment?.origin_city,
          destinationCity: offer.shipment?.destination_city,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('Offer declined.');
      }
      
      fetchData();
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

  const pendingOffers = incomingOffers.filter(o => o.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipper Hub</h1>
          <p className="text-gray-500 mt-1">Manage your loads, sent requests, and incoming offers</p>
        </div>
        <Link to="/shipper/post-shipment">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Post New Load
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="loads" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Loads
            {shipments.length > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700">{shipments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Requests
            {sentRequests.length > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700">{sentRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2 relative">
            <Inbox className="h-4 w-4" />
            Incoming Offers
            {pendingOffers.length > 0 && (
              <Badge className="ml-1 bg-orange-600 text-white">{pendingOffers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loads">
          {shipments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No loads posted yet</h3>
              <p className="text-gray-500 mb-6">Post a shipment to start receiving offers from truckers</p>
              <Link to="/shipper/post-shipment">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Post Your First Load
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {shipments.map(shipment => (
                <Card key={shipment.id} className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
                          </div>
                          <StatusBadge status={shipment.status} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />{new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="flex items-center font-semibold text-gray-900"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{shipment.budget_per_tonne.toLocaleString()} /t</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-purple-600" />{shipment.weight_tonnes}t load</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                        <Link to={`/shipper/shipments/${shipment.id}`}><Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50"><Eye className="h-4 w-4 mr-2" />View</Button></Link>
                        
                        {shipment.status === 'pending' && (
                          <>
                            <Link to={`/shipper/shipments/${shipment.id}/edit`}><Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4 mr-2" />Edit</Button></Link>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete your shipment listing.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteShipment(shipment.id)} className="bg-red-600 hover:bg-red-700">
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

        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No requests sent yet</h3>
              <p className="text-gray-500 mb-6">Browse available trucks to book space for your goods</p>
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
                          <div className="flex items-center text-lg font-bold text-gray-900">
                            {request.trip.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 mx-2" /> {request.trip.destination_city}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-500" />Trip Date: {new Date(request.trip.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center font-bold text-green-700"><IndianRupee className="h-4 w-4 mr-1" />Price: {request.trip.price_per_tonne?.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold">Goods</p>
                          <p className="text-sm font-semibold">{request.weight_tonnes}t — {request.goods_description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'accepted' && (
                          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${request.id}`)}>
                            <MessageSquare className="h-4 w-4 mr-2" />Chat with Trucker
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming">
          {incomingOffers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No offers received</h3>
              <p className="text-gray-500">When truckers send offers for your loads, they'll appear here</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {incomingOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden border-blue-100 shadow-sm hover:shadow-md transition-shadow">
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
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-500" />Ready: {new Date(offer.shipment.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center font-bold text-orange-600"><IndianRupee className="h-4 w-4 mr-1" />Offer: {offer.proposed_price_per_tonne?.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                              {offer.trucker?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{offer.trucker?.full_name}</p>
                              <div className="flex items-center gap-1 text-xs text-yellow-600">
                                <Star className="h-3 w-3 fill-current" />
                                {offer.trucker?.rating?.toFixed(1) || '0.0'} Rating
                              </div>
                            </div>
                          </div>
                          {offer.message && (
                            <p className="mt-2 text-sm text-gray-600 italic">"{offer.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                        {offer.status === 'pending' ? (
                          <>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleOfferAction(offer, 'accepted')} disabled={!!actionLoading}>
                              {actionLoading === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />Accept</>}
                            </Button>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleOfferAction(offer, 'declined')} disabled={!!actionLoading}>
                              <X className="h-4 w-4 mr-2" />Decline
                            </Button>
                          </>
                        ) : offer.status === 'accepted' && (
                          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${offer.id}`)}>
                            <MessageSquare className="h-4 w-4 mr-2" />Chat
                          </Button>
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