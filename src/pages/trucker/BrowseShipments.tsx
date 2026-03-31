"use client";

import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Search,   ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { data: shipments = [], isLoading: loading } = useQuery({
    queryKey: ['shipments', 'pending'],
    queryFn: async () => {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (shipmentError) throw shipmentError;
      
      if (shipmentData && shipmentData.length > 0) {
        const shipperIds = [...new Set(shipmentData.map(s => s.shipper_id))];
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .in('id', shipperIds);

        if (!userError && userData) {
          const userMap = userData.reduce((acc: any, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});

          return shipmentData.map(s => ({
            ...s,
            shipper: userMap[s.shipper_id]
          }));
        }
      }
      return shipmentData || [];
    },
    enabled: !!userProfile,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-shipment-requests', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase        .from('shipment_requests')
        .select('shipment_id')
        .eq('trucker_id', userProfile?.id);
      
      if (error) throw error;
      return data.map(r => r.shipment_id.toString());
    },
    enabled: !!userProfile?.id,
  });

  const handleContactShipper = async (shipmentId: string) => {
    if (!userProfile?.id) return;
    
    setSubmittingId(shipmentId);
    try {
      const { error } = await supabase
        .from('shipment_requests')
        .insert({
          shipment_id: parseInt(shipmentId),
          trucker_id: userProfile.id,
          status: 'pending'
        });

      if (error) throw error;

      showSuccess('Interest expressed! The shipper will be notified.');
      queryClient.invalidateQueries({ queryKey: ['my-shipment-requests', userProfile.id] });
    } catch (error: any) {
      showError(error.message || 'Failed to send request');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => 
      s.origin_city.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.destination_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.goods_description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shipments, searchTerm]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Shipments</h1>
        <p className="text-gray-600">Find goods that need transport on your routes</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by city or goods..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredShipments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No shipments found</h3>
          <p className="text-gray-500">Try adjusting your search or check back later</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredShipments.map((shipment) => {
            const hasRequested = myRequests.includes(shipment.id.toString());
            
            return (
              <Card key={shipment.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xl font-bold text-gray-900">
                          {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {shipment.weight_tonnes} Tonnes
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
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods Description</p>
                        <p className="text-sm text-gray-700">{shipment.goods_description}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[150px]">
                      {hasRequested ? (
                        <Button disabled className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Interest Sent
                        </Button>
                      ) : (
                        <Button 
                          className="bg-orange-600 hover:bg-orange-700 w-full"
                          onClick={() => handleContactShipper(shipment.id.toString())}
                          disabled={submittingId === shipment.id.toString()}
                        >
                          {submittingId === shipment.id.toString() ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : 'Contact Shipper'}
                        </Button>
                      )}
                      <p className="text-[10px] text-center text-gray-400">
                        Posted by {shipment.shipper?.full_name || 'Verified Shipper'}
                      </p>
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

export default BrowseShipments;