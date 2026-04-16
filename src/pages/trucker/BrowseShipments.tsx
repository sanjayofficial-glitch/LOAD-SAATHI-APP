"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Search, 
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { sendNotification } from '@/utils/notifications';

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [offerModal, setOfferModal] = useState<{ isOpen: boolean; shipment: any }>({
    isOpen: false,
    shipment: null
  });
  const [price, setPrice] = useState('');
  const [sending, setSending] = useState(false);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['browse-shipments-trucker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, shipper:users(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile,
  });

  const filteredShipments = shipments.filter((s: any) => 
    s.origin_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destination_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.goods_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendOffer = async () => {
    if (!offerModal.shipment || !userProfile) return;
    
    const proposedPrice = parseFloat(price);
    if (isNaN(proposedPrice) || proposedPrice <= 0) {
      showError("Please enter a valid price");
      return;
    }

    setSending(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabaseClient = createClerkSupabaseClient(supabaseToken);

      const { data: request, error } = await supabaseClient
        .from('shipment_requests')
        .insert({
          shipment_id: offerModal.shipment.id,
          trucker_id: userProfile.id,
          shipper_id: offerModal.shipment.shipper_id,
          proposed_price_per_tonne: proposedPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      await sendNotification({
        userId: offerModal.shipment.shipper_id,
        message: `${userProfile.full_name} offered ₹${proposedPrice}/t for your ${offerModal.shipment.weight_tonnes}t shipment from ${offerModal.shipment.origin_city} to ${offerModal.shipment.destination_city}`,
        getToken: () => getToken({ template: 'supabase' })
      });

      showSuccess("Offer sent successfully!");
      setOfferModal({ isOpen: false, shipment: null });
      setPrice('');
      navigate('/trucker/my-requests');
    } catch (err: any) {
      showError(err.message || "Failed to send offer");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Goods to Carry</h1>
        <p className="text-gray-600">Browse available shipments and send offers to shippers</p>
      </div>

      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
          placeholder="Search by origin, destination, or goods type..."
          className="pl-10 py-6 text-lg shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No matching shipments found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredShipments.map((shipment: any) => (
            <Card key={shipment.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="bg-orange-50/50 pb-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    {shipment.weight_tonnes} Tonnes
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Posted {new Date(shipment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center mt-2">
                  {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4 pt-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {shipment.goods_description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                    {new Date(shipment.departure_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-green-600 font-bold">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {shipment.budget_per_tonne}/t
                  </div>
                </div>
                <div className="pt-4 mt-auto">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setOfferModal({ isOpen: true, shipment })}
                  >
                    Send Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {offerModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Send Your Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-orange-800">
                  {offerModal.shipment.origin_city} → {offerModal.shipment.destination_city}
                </p>
                <p className="text-orange-600">Shipper's Budget: ₹{offerModal.shipment.budget_per_tonne}/t</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Price (₹/tonne)</label>
                <Input 
                  type="number"
                  placeholder="Enter your price per tonne"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setOfferModal({ isOpen: false, shipment: null })}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handleSendOffer}
                  disabled={sending || !price}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Offer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BrowseShipments;