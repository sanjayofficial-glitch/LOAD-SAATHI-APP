"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
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

const MyShipments = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'loads';

  const [myLoads, setMyLoads] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      const supabase = await getAuthenticatedClient();
      
      // 1. Fetch My Posted Loads
      const { data: loads } = await supabase
        .from('shipments')
        .select('*')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 2. Fetch Sent Requests (Shipper -> Trucker's Trip)
      const { data: sent } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips(
            *,
            trucker:users(*)
          )
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 3. Fetch Incoming Offers (Trucker -> Shipper's Load)
      const { data: incoming } = await supabase
        .from('shipment_requests')
        .select(`
          *,
          shipment:shipments(*),
          trucker:users(*)
        `)
        .order('created_at', { ascending: false });

      setMyLoads(loads || []);
      setSentRequests(sent || []);
      // Filter incoming offers for shipments owned by this shipper
      setIncomingOffers((incoming || []).filter(r => r.shipment?.shipper_id === userProfile.id));
      
    } catch (err: any) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleOfferAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    setActionLoading(requestId);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('shipment_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      showSuccess(`Offer ${status} successfully`);
      fetchData();
    } catch (err: any) {
      showError('Failed to update offer');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipper Hub</h1>
          <p className="text-gray-500">Manage your loads and bookings in one place</p>
        </div>
        <Link to="/shipper/post-shipment">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
            Post New Shipment
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="loads" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Loads {myLoads.length > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700">{myLoads.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Requests {sentRequests.length > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700">{sentRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Incoming Offers {incomingOffers.length > 0 && <Badge className="ml-1 bg-orange-100 text-orange-700">{incomingOffers.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* TAB: MY LOADS */}
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
                            {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
                          </div>
                          <Badge className={
                            shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            shipment.status === 'matched' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {shipment.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />{new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-purple-600" />{shipment.weight_tonnes}t</div>
                          <div className="flex items-center font-semibold text-gray-900"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{shipment.budget_per_tonne.toLocaleString()} /t</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                        <Link to={`/shipper/shipments/${shipment.id}`}><Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50"><Eye className="h-4 w-4 mr-2" />View</Button></Link>
                        {shipment.status === 'pending' && (
                          <>
                            <Link to={`/shipper/shipments/${shipment.id}/edit`}><Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4 mr-2" />Edit</Button></Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Delete</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your shipment listing.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteShipment(shipment.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
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

        {/* TAB: SENT REQUESTS */}
        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No requests sent yet</h3>
              <p className="text-gray-500 mb-6">Browse available trucks to find space for your goods</p>
              <Link to="/browse-trucks"><Button className="bg-blue-600">Find Trucks</Button></Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {sentRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {request.trip?.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 mx-2" /> {request.trip?.destination_city}
                          </div>
                          <Badge className={
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            request.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                            'bg-red-100 text-red-700'
                          }>{request.status.toUpperCase()}</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />Departure: {new Date(request.trip?.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center font-bold text-green-600"><IndianRupee className="h-4 w-4 mr-1" />Price: {request.trip?.price_per_tonne.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Trucker: {request.trip?.trucker?.full_name}</p>
                          <p className="text-sm text-gray-700">Your Goods: {request.goods_description} ({request.weight_tonnes}t)</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${request.id}`)}><MessageSquare className="h-4 w-4 mr-2" />Chat</Button>
                            <a href={`tel:${request.trip?.trucker?.phone}`} className="block"><Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button></a>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Waiting for trucker response</p>
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

        {/* TAB: INCOMING OFFERS */}
        <TabsContent value="incoming">
          {incomingOffers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No incoming offers</h3>
              <p className="text-gray-500">When truckers offer to carry your loads, they will appear here</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {incomingOffers.map((request) => (
                <Card key={request.id} className="overflow-hidden border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xl font-bold text-gray-900">
                            {request.shipment?.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 mx-2" /> {request.shipment?.destination_city}
                          </div>
                          <Badge className={
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            request.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                            'bg-red-100 text-red-700'
                          }>{request.status.toUpperCase()}</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />Ready Date: {new Date(request.shipment?.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center font-bold text-green-600"><IndianRupee className="h-4 w-4 mr-1" />Trucker Offer: {request.proposed_price_per_tonne?.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Trucker: {request.trucker?.full_name}</p>
                          <p className="text-sm text-gray-700">{request.message || 'No message provided'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'pending' ? (
                          <>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleOfferAction(request.id, 'accepted')} disabled={!!actionLoading}>{actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}Accept</Button>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleOfferAction(request.id, 'rejected')} disabled={!!actionLoading}><X className="h-4 w-4 mr-2" />Decline</Button>
                          </>
                        ) : request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${request.id}`)}><MessageSquare className="h-4 w-4 mr-2" />Chat</Button>
                            <a href={`tel:${request.trucker?.phone}`} className="block"><Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button></a>
                          </div>
                        ) : (
                          <p className="text-center text-sm text-gray-400 italic">Offer declined</p>
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