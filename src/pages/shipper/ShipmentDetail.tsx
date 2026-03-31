"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  ArrowLeft, 
  User, 
  Star, 
  Phone, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const ShipmentDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

      if (shipmentError) throw shipmentError;
      setShipment(shipmentData);

      const { data: requestData, error: requestError } = await supabase
        .from('shipment_requests')
        .select('*')
        .eq('shipment_id', id)
        .order('created_at', { ascending: false });

      if (requestError) throw requestError;

      if (requestData && requestData.length > 0) {
        const truckerIds = [...new Set(requestData.map(r => r.trucker_id))];
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .in('id', truckerIds);

        if (!userError && userData) {
          const userMap = userData.reduce((acc: any, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});

          const requestsWithTruckers = requestData.map(r => ({
            ...r,
            trucker: userMap[r.trucker_id]
          }));
          setRequests(requestsWithTruckers);
        } else {
          setRequests(requestData);
        }
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error('[ShipmentDetail] Error:', error);
      showError(error.message || 'Failed to load shipment details');
      navigate('/shipper/my-shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRequestAction = async (requestId: string, status: 'accepted' | 'declined') => {
    setActionLoading(requestId);
    try {
      const { error: requestError } = await supabase
        .from('shipment_requests')
        .update({ status })
        .eq('id', requestId);

      if (requestError) throw requestError;

      if (status === 'accepted') {
        const { error: shipmentError } = await supabase
          .from('shipments')
          .update({ status: 'matched' })
          .eq('id', id);
                if (shipmentError) throw shipmentError;
        
        await supabase
          .from('shipment_requests')
          .update({ status: 'declined' })
          .eq('shipment_id', id)
          .eq('status', 'pending')
          .neq('id', requestId);
      }

      showSuccess(`Request ${status} successfully!`);
      fetchData();
    } catch (error: any) {
      showError(error.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (!shipment) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Shipments
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {shipment.origin_city} → {shipment.destination_city}
                </CardTitle>
                <Badge className={
                  shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                  shipment.status === 'matched' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {shipment.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Departure Date</p>
                  <div className="flex items-center font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    {new Date(shipment.departure_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Weight</p>
                  <div className="flex items-center font-medium">
                    <Package className="h-4 w-4 mr-2 text-purple-600" />
                    {shipment.weight_tonnes} Tonnes
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Budget</p>
                  <div className="flex items-center font-bold text-green-600">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {shipment.budget_per_tonne.toLocaleString()} /t
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods Description</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{shipment.goods_description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pickup Address</p>
                    <p className="text-sm text-gray-600 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                      {shipment.pickup_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-600 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      {shipment.delivery_address}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              Trucker Requests 
              <Badge variant="outline" className="ml-3">{requests.length}</Badge>
            </h3>
            
            {requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No truckers have expressed interest yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className={`border-l-4 ${
                    request.status === 'accepted' ? 'border-l-green-500' : 
                    request.status === 'declined' ? 'border-l-red-500' : 
                    'border-l-yellow-500'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                            <User className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{request.trucker?.full_name || 'Trucker'}</h4>
                            <div className="flex items-center text-sm text-gray-500">
                              <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                              {request.trucker?.rating?.toFixed(1) || '0.0'} • {request.trucker?.total_trips || 0} Trips
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {request.status === 'pending' && shipment.status === 'pending' ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleRequestAction(request.id, 'declined')}
                                disabled={!!actionLoading}
                              >
                                {actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                Decline
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleRequestAction(request.id, 'accepted')}
                                disabled={!!actionLoading}
                              >
                                {actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Accept
                              </Button>
                            </>
                          ) : (
                            <Badge className={
                              request.status === 'accepted' ? 'bg-green-100 text-green-700' :                               request.status === 'declined' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-600'
                            }>
                              {request.status.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {request.status === 'accepted' && (
                        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row gap-4">
                          <a href={`tel:${request.trucker?.phone}`} className="flex-1">
                            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                              <Phone className="h-4 w-4 mr-2" />
                              Call Trucker
                            </Button>
                          </Link to={`/chat/${request.id}`} className="flex-1">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Next Steps</CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-4">
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex-items-center justify-center flex-shrink-0 font-bold">1</div>
                <p>Review the truckers who have expressed interest in your shipment.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex-items-center justify-center flex-shrink-0 font-bold">2</div>
                <p>Click <strong>Accept</strong> on the trucker you want to hire. This will notify them and close the shipment to others.</p>
              </div
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex-items-center justify-center flex-shrink-0 font-bold">3</div>
                <p>Once accepted, you'll get their contact details to finalize the pickup.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetail;