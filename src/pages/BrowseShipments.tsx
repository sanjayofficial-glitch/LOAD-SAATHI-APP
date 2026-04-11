"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package,   
  MapPin,   
  Calendar, 
  IndianRupee, 
  Search, 
  ArrowRight,
  Loader2,
  Filter,
  X
} from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Shipment {
  id: string;
  origin_city: string;
  destination_city: string;
  departure_date: string;
  goods_description: string;
  weight_tonnes: number;
  available_capacity_tonnes: number;
  budget_per_tonne: number;
  shipper_id: string;
  shipper?: {
    id: string;
    full_name: string;
  };
}

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    minWeight: ""
  });

  // Offer Dialog State
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    const fetchShipments = async () => {
      if (!userProfile?.id) return;
      try {
        const supabase = await getAuthenticatedClient();
        const { data, error } = await supabase
          .from('shipments')
          .select('*, shipper:users(*)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setShipments(data || []);
      } catch (err: any) {
        showError('Failed to fetch shipments');
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, [userProfile?.id]);

  const filteredShipments = useMemo(() => {
    let result = [...shipments];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(shipment => 
        shipment.origin_city.toLowerCase().includes(s) ||
        shipment.destination_city.toLowerCase().includes(s)
      );
    }

    if (filters.origin) {
      result = result.filter(s => s.origin_city.toLowerCase().includes(filters.origin.toLowerCase()));
    }

    if (filters.destination) {
      result = result.filter(s => s.destination_city.toLowerCase().includes(filters.destination.toLowerCase()));
    }

    if (filters.minWeight) {
      const minCap = parseFloat(filters.minWeight);
      result = result.filter(s => s.weight_tonnes >= minCap);
    }

    return result;
  }, [shipments, search, filters]);

  const openOfferDialog = (shipment: Shipment) => {
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
      const supabase = await getAuthenticatedClient();
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

      showSuccess('Offer sent to shipper!');
      setIsOfferDialogOpen(false);
      setProposedPrice('');
      setMessage('');
      navigate('/trucker/my-requests');
    } catch (err: any) {
      showError(err.message || 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Shipments</h1>
        <p className="text-gray-600">Find loads posted by shippers and send offers</p>
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
                <label className="text-sm font-medium text-gray-700">Origin City</label>
                <Input 
                  placeholder="e.g. Mumbai" 
                  value={filters.origin}
                  onChange={(e) => setFilters({...filters, origin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Destination City</label>
                <Input 
                  placeholder="e.g. Delhi" 
                  value={filters.destination}
                  onChange={(e) => setFilters({...filters, destination: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Min Weight (Tonnes)</label>
                <Input 
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
              placeholder="Search by city..." 
              className="pl-10 py-6 rounded-xl border-orange-100 focus:ring-orange-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredShipments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
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
                              <p className="font-medium">
                                {new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Budget</p>
                              <p className="font-bold text-green-600">{shipment.budget_per_tonne.toLocaleString()}/t</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-64 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-center">
                        <div className="space-y-3">
                          <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700 shadow-md"
                            onClick={() => openOfferDialog(shipment)}
                          >
                            Book Space
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Link to={`/shipper/shipments/${shipment.id}`} className="block">
                            <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                              View Details
                            </Button>
                          </Link>
                        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Offer for {selectedShipment?.origin_city} → {selectedShipment?.destination_city}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Price per Tonne (₹)</label>
              <Input 
                type="number" 
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="Enter your price"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (Optional)</label>
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to the shipper"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitOffer} disabled={sendingOffer} className="bg-orange-600">
              {sendingOffer ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseShipments;