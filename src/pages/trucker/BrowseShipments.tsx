"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Calendar, 
  Package, 
  ArrowRight, 
  Loader2, 
  Send,
  IndianRupee,
  MapPin,
  Filter,
  X,
  Truck
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { sendNotification } from '@/utils/notifications';

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minWeight: ''
  });

  // Offer Dialog State
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { data, error } = await supabase
        .from('shipments')
        .select('*, shipper:users(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (err: any) {
      showError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [getToken]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = s.origin_city.toLowerCase().includes(search) || 
                           s.destination_city.toLowerCase().includes(search) ||
                           s.goods_description.toLowerCase().includes(search);
      const matchesOrigin = !filters.origin || s.origin_city.toLowerCase().includes(filters.origin.toLowerCase());
      const matchesDest = !filters.destination || s.destination_city.toLowerCase().includes(filters.destination.toLowerCase());
      const matchesWeight = !filters.minWeight || s.weight_tonnes >= parseFloat(filters.minWeight);
      
      return matchesSearch && matchesOrigin && matchesDest && matchesWeight;
    });
  }, [shipments, searchTerm, filters]);

  const openOfferDialog = (shipment: any) => {
    setSelectedShipment(shipment);
    setProposedPrice(shipment.budget_per_tonne.toString());
    setIsOfferDialogOpen(true);
  };

  const submitOffer = async () => {
    if (!selectedShipment || !userProfile) return;

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price');
      return;
    }

    setSendingOffer(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('shipment_requests')
        .insert({
          shipment_id: selectedShipment.id,
          trucker_id: userProfile.id,
          shipper_id: selectedShipment.shipper_id,
          proposed_price_per_tonne: price,
          message: message.trim(),
          status: 'pending'
        });

      if (error) throw error;

      // Send notification to shipper
      await sendNotification({
        userId: selectedShipment.shipper_id,
        message: `${userProfile.full_name} offered ₹${price}/t for your ${selectedShipment.weight_tonnes}t shipment from ${selectedShipment.origin_city} to ${selectedShipment.destination_city}`,
        getToken: () => getToken({ template: 'supabase' })
      });

      showSuccess('Offer sent to shipper!');
      setIsOfferDialogOpen(false);
      setProposedPrice('');
      setMessage('');
      navigate('/trucker/my-requests?tab=sent');
    } catch (err: any) {
      showError(err.message || 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Goods to Carry</h1>
        <p className="text-gray-600">Browse available shipments posted by shippers and send your best offer</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-4 w-4 mr-2 text-orange-600" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin City</Label>
                <Input 
                  id="origin" 
                  placeholder="e.g. Mumbai" 
                  value={filters.origin}
                  onChange={(e) => setFilters({...filters, origin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination City</Label>
                <Input 
                  id="destination" 
                  placeholder="e.g. Delhi" 
                  value={filters.destination}
                  onChange={(e) => setFilters({...filters, destination: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Min Weight (Tonnes)</Label>
                <Input 
                  id="weight" 
                  type="number" 
                  placeholder="e.g. 5" 
                  value={filters.minWeight}
                  onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                />
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setFilters({ origin: '', destination: '', minWeight: '' })}
              >
                <X className="h-4 w-4 mr-2" /> Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Shipments List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by origin, destination, or goods type..." 
              className="pl-10 py-6 rounded-xl border-orange-100 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No shipments found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredShipments.map((shipment) => (
                <Card key={shipment.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-100 p-3 rounded-full">
                              <Package className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {shipment.origin_city} <ArrowRight className="h-4 w-4 inline mx-1 text-gray-400" /> {shipment.destination_city}
                              </h3>
                              <p className="text-sm text-gray-600">{shipment.goods_description}</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {shipment.weight_tonnes} Tonnes
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Ready Date</p>
                              <p className="font-medium">{new Date(shipment.departure_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Budget</p>
                              <p className="font-bold text-green-600">₹{shipment.budget_per_tonne.toLocaleString()} /t</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-48 bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center">
                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700 shadow-md"
                          onClick={() => openOfferDialog(shipment)}
                        >
                          Send Offer
                          <Send className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Offer Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Offer to Shipper</DialogTitle>
            <DialogDescription>
              Propose your price for transporting {selectedShipment?.weight_tonnes}t of {selectedShipment?.goods_description}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Your Price per Tonne (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="price"
                  type="number" 
                  className="pl-10"
                  value={proposedPrice} 
                  onChange={(e) => setProposedPrice(e.target.value)} 
                />
              </div>
              <p className="text-xs text-gray-500">Shipper's budget: ₹{selectedShipment?.budget_per_tonne}/t</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Input 
                id="message"
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="e.g. I have a 12-wheeler available."
              />
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Offer:</span>
                <span className="font-bold text-orange-700">
                  ₹{((parseFloat(proposedPrice) || 0) * (selectedShipment?.weight_tonnes || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)} disabled={sendingOffer}>Cancel</Button>
            <Button 
              onClick={submitOffer} 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={sendingOffer || !proposedPrice}
            >
              {sendingOffer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Send Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseShipments;