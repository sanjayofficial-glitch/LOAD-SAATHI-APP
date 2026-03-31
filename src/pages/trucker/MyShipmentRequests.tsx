"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Calendar, 
  IndianRupee, 
  ArrowRight,
  Loader2,
  Clock,
  XCircle,
  MessageSquare,
  Phone
} from 'lucide-react';
import { showError } from '@/utils/toast';

const MyShipmentRequests = () => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      // 1. Fetch requests
      const { data: requestData, error: requestError } = await supabase
        .from('shipment_requests')
        .select('*')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (requestError) throw requestError;

      if (requestData && requestData.length > 0) {
        // 2. Fetch related shipments
        const shipmentIds = [...new Set(requestData.map(r => r.shipment_id))];
        const { data: shipmentData, error: shipmentError } = await supabase
          .from('shipments')
          .select('*')
          .in('id', shipmentIds);

        if (shipmentError) throw shipmentError;

        // 3. Fetch shippers for those shipments
        const shipperIds = [...new Set(shipmentData?.map(s => s.shipper_id) || [])];
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .in('id', shipperIds);

        const userMap = (userData || []).reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});

        const shipmentMap = (shipmentData || []).reduce((acc: any, shipment: any) => {
          acc[shipment.id] = {
            ...shipment,
            shipper: userMap[shipment.shipper_id]
          };
          return acc;
        }, {});

        const requestsWithData = requestData.map(r => ({
          ...r,
          shipment: shipmentMap[r.shipment_id]
        }));

        setRequests(requestsWithData);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error('[MyShipmentRequests] Error:', error);
      showError('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchRequests();

    if (userProfile?.id) {
      const channel = supabase
        .channel(`my_shipment_requests_${userProfile.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'shipment_requests',
          filter: `trucker_id=eq.${userProfile.id}`
        }, () => {
          fetchRequests();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile?.id, fetchRequests]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Shipment Requests</h1>
        <p className="text-gray-600">Track the status of goods you've applied to transport</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No requests yet</h3>
          <p className="text-gray-500 mb-6">Browse available shipments to find goods for your truck</p>
          <Link to="/trucker/browse-shipments">
            <Button className="bg-orange-600 hover:bg-orange-700">
              Find Goods
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => {
            const shipment = request.shipment;
            if (!shipment) return null;

            return (
              <Card key={request.id} className={`overflow-hidden border-orange-100 ${
                request.status === 'accepted' ? 'ring-2 ring-green-500 ring-opacity-50' : ''
              }`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xl font-bold text-gray-900">
                          {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
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
                          Ready by: {new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex items-center font-bold text-green-600">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          Budget: {shipment.budget_per_tonne.toLocaleString()} /t
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods</p>
                        <p className="text-sm text-gray-700">{shipment.goods_description} ({shipment.weight_tonnes}t)</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[180px]">
                      {request.status === 'accepted' ? (
                        <>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-2">
                            <p className="text-[10px] text-green-700 font-bold uppercase mb-1">Shipper Contact</p>
                            <p className="text-sm font-bold text-gray-900">{shipment.shipper?.full_name}</p>
                            <p className="text-xs text-gray-600">{shipment.shipper?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <a href={`tel:${shipment.shipper?.phone}`} className="flex-1">
                              <Button size="sm" variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : request.status === 'pending' ? (
                        <div className="text-center space-y-2">
                          <Clock className="h-8 w-8 text-yellow-400 mx-auto" />
                          <p className="text-xs text-gray-500">Waiting for shipper to review your interest</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <XCircle className="h-8 w-8 text-red-400 mx-auto" />
                          <p className="text-xs text-gray-500">Shipper chose another trucker for this load</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyShipmentRequests;