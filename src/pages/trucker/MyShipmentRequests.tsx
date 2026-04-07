"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Calendar, 
  IndianRupee, 
  ArrowRight,
  Loader2,
  Clock,
  XCircle,
  CheckCircle,
  Phone,
  MessageSquare,
  Send,
  Inbox,
  Check,
  X
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const MyShipmentRequests = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const supabase = await getAuthenticatedClient();
      
      // 1. Fetch Sent Requests (Trucker -> Shipper's Load)
      const { data: sent, error: sentError } = await supabase
        .from('shipment_requests')
        .select(`
          *,
          shipment:shipments(
            *,
            shipper:users!shipments_shipper_id_fkey(*)
          )
        `)
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // 2. Fetch Received Requests (Shipper -> Trucker's Trip)
      const { data: received, error: receivedError } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips(*),
          shipper:users(*)
        `)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Filter received requests for trips owned by this trucker
      const myReceived = (received || []).filter(r => r.trip?.trucker_id === userProfile.id);

      setSentRequests(sent || []);
      setReceivedRequests(myReceived);
    } catch (error: any) {
      console.error('[MyShipmentRequests] Error:', error);
      showError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestAction = async (requestId: string, status: 'accepted' | 'declined') => {
    setActionLoading(requestId);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      showSuccess(`Request ${status} successfully`);
      fetchData(); // Refresh list
    } catch (err: any) {
      showError(err.message || 'Failed to update request');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <p className="text-gray-600">Manage your sent offers and incoming bookings</p>
      </div>

      <Tabs defaultValue="received" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Incoming {receivedRequests.length > 0 && <Badge className="ml-1 bg-orange-500">{receivedRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent {sentRequests.length > 0 && <Badge className="ml-1 bg-gray-500">{sentRequests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No incoming requests</h3>
              <p className="text-gray-500">When shippers book your trips, they will appear here</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {receivedRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden border-orange-100">
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
                          }>
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            Trip Date: {new Date(request.trip?.departure_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center font-bold text-green-600">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Price: {request.trip?.price_per_tonne.toLocaleString()} /t
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Shipper: {request.shipper?.full_name}</p>
                          <p className="text-sm text-gray-700">{request.goods_description} ({request.weight_tonnes}t)</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'pending' ? (
                          <>
                            <Button 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleRequestAction(request.id, 'accepted')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                              Accept
                            </Button>
                            <Button 
                              variant="outline" 
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRequestAction(request.id, 'declined')}
                              disabled={!!actionLoading}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </>
                        ) : request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <Button 
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              onClick={() => navigate(`/chat/${request.id}`)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                            <a href={`tel:${request.shipper?.phone}`} className="block">
                              <Button variant="outline" className="w-full">
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                            </a>
                          </div>
                        ) : (
                          <p className="text-center text-sm text-gray-400 italic">Request declined</p>
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
              <h3 className="text-lg font-semibold text-gray-900">No requests sent</h3>
              <p className="text-gray-500">Browse shipments to find goods for your truck</p>
              <Link to="/trucker/browse-shipments" className="mt-4 inline-block">
                <Button className="bg-orange-600">Browse Shipments</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {sentRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden border-orange-100">
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
                          }>
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            Ready Date: {new Date(request.shipment?.departure_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center font-bold text-green-600">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Your Offer: {request.proposed_price?.toLocaleString()} /t
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods</p>
                          <p className="text-sm text-gray-700">{request.shipment?.goods_description} ({request.shipment?.weight_tonnes}t)</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'accepted' ? (
                          <div className="space-y-2">
                            <Button 
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              onClick={() => navigate(`/chat/${request.id}`)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                            <a href={`tel:${request.shipment?.shipper?.phone}`} className="block">
                              <Button variant="outline" className="w-full">
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                            </a>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Waiting for shipper response</p>
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

export default MyShipmentRequests;