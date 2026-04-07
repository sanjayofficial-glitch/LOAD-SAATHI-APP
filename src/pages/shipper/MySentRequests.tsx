"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Calendar, 
  IndianRupee, 
  ArrowRight,
  Loader2,
  Clock,
  XCircle,
  CheckCircle,
  Phone,
  MessageSquare,
  Send
} from 'lucide-react';
import { showError } from '@/utils/toast';

const MySentRequests = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const supabase = await getAuthenticatedClient();
      
      const { data, error } = await supabase
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

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('[MySentRequests] Error:', error);
      showError('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Sent Requests</h1>
        <p className="text-gray-600">Track the status of space you've requested on trucks</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No requests sent yet</h3>
          <p className="text-gray-500 mb-6">Browse available trucks to find space for your goods</p>
          <Link to="/browse-trucks">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Find Trucks
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => {
            const trip = request.trip;
            if (!trip) return null;

            return (
              <Card key={request.id} className={`overflow-hidden border-blue-100 ${
                request.status === 'accepted' ? 'ring-2 ring-green-500 ring-opacity-50' : ''
              }`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xl font-bold text-gray-900">
                          {trip.origin_city} <ArrowRight className="h-4 w-4 text-gray-400" /> {trip.destination_city}
                        </div>
                        <Badge className={
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : 
                          request.status === 'accepted' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                          'bg-red-100 text-red-700 hover:bg-red-100'
                        }>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                          Departure: {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex items-center font-bold text-green-600">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          Price: {trip.price_per_tonne.toLocaleString()} /t
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Your Goods</p>
                        <p className="text-sm text-gray-700">{request.goods_description} ({request.weight_tonnes}t)</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[180px]">
                      {request.status === 'accepted' ? (
                        <>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-2">
                            <p className="text-[10px] text-green-700 font-bold uppercase mb-1">Trucker Contact</p>
                            <p className="text-sm font-bold text-gray-900">{trip.trucker?.full_name}</p>
                            <p className="text-xs text-gray-600">{trip.trucker?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <a href={`tel:${trip.trucker?.phone}`} className="flex-1">
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
                        <div className="text-center space-y-2 p-4 bg-yellow-50 rounded-lg">
                          <Clock className="h-8 w-8 text-yellow-400 mx-auto" />
                          <p className="text-xs text-gray-600">Waiting for trucker to review your request</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-2 p-4 bg-red-50 rounded-lg">
                          <XCircle className="h-8 w-8 text-red-400 mx-auto" />
                          <p className="text-xs text-gray-600">Trucker declined or space is no longer available</p>
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

export default MySentRequests;