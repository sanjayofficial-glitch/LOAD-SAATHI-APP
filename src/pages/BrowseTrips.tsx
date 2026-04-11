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
  Truck, 
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

interface Trip {
  id: string;
  trucker_id: string;
  origin_city: string;
  destination_city: string;
  departure_date: string;
  goods_description: string;
  available_capacity_tonnes: number;
  price_per_tonne: number;
  vehicle_type: string;
  vehicle_number: string;
  status: string;
}

const BrowseTrips = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    minCapacity: "",
    maxPrice: ""
  });

  // Trip Dialog State
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [goodsDescription, setGoodsDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!userProfile?.id) return;
      try {
        const supabase = await getAuthenticatedClient();
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTrips(data || []);
      } catch (err: any) {
        showError('Failed to fetch trips');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [userProfile?.id, getAuthenticatedClient]);

  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(trip => 
        trip.origin_city.toLowerCase().includes(s) ||
        trip.destination_city.toLowerCase().includes(s)
      );
    }

    if (filters.origin) {
      result = result.filter(t => t.origin_city.toLowerCase().includes(filters.origin.toLowerCase()));
    }

    if (filters.destination) {
      result = result.filter(t => t.destination_city.toLowerCase().includes(filters.destination.toLowerCase()));
    }

    if (filters.minCapacity) {
      const minCap = parseFloat(filters.minCapacity);
      result = result.filter(t => t.available_capacity_tonnes >= minCap);
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      result = result.filter(t => t.price_per_tonne <= maxPrice);
    }

    return result;
  }, [trips, search, filters]);

  const openRequestDialog = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsRequestDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedTrip || !userProfile) return;

    const requestedWeight = parseFloat(weight);
    if (isNaN(requestedWeight) || requestedWeight <= 0) {
      showError('Please enter a valid weight');
      return;
    }

    if (requestedWeight > selectedTrip.available_capacity_tonnes) {
      showError(`Requested weight exceeds available capacity (${selectedTrip.available_capacity_tonnes} tonnes)`);
      return;
    }

    setSendingRequest(true);
    try {
      const supabase = await getAuthenticatedClient();
      
      const { error } = await supabase
        .from('requests')
        .insert({
          trip_id: selectedTrip.id,
          shipper_id: userProfile.id,
          receiver_id: selectedTrip.trucker_id,
          goods_description: goodsDescription.trim(),
          weight_tonnes: requestedWeight,
          pickup_address: pickupAddress.trim(),
          delivery_address: deliveryAddress.trim(),
          status: 'pending'
        });

      if (error) throw error;

      showSuccess('Booking request sent successfully!');
      setIsRequestDialogOpen(false);
      setGoodsDescription('');
      setWeight('');
      setPickupAddress('');
      setDeliveryAddress('');
      navigate('/shipper/my-shipments?tab=sent');
    } catch (err: any) {
      showError(err.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Trips</h1>
        <p className="text-gray-600">Find available truck space for your shipments</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-4 w-4 mr-2 text-blue-600" />
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
                <label className="text-sm font-medium text-gray-700">Min Capacity (Tonnes)</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 5" 
                  value={filters.minCapacity}
                  onChange={(e) => setFilters({...filters, minCapacity: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Max Price per Tonne (₹)</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 3000" 
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                />
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setFilters({ origin: '', destination: '', minCapacity: '', maxPrice: '' })}
              >
                <X className="h-4 w-4 mr-2" /> Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trips List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by city..." 
              className="pl-10 py-6 rounded-xl border-blue-100 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredTrips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="overflow-hidden border-blue-100 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <Truck className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {trip.origin_city} <ArrowRight className="h-4 w-4 inline mx-1 text-gray-400" /> {trip.destination_city}
                              </h3>
                              <p className="text-sm text-gray-600">{trip.goods_description}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {trip.available_capacity_tonnes} Tonnes
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Departure</p>
                              <p className="font-medium">
                                {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Price</p>
                              <p className="font-bold text-green-600">
                                {trip.price_per_tonne.toLocaleString()} /t
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-64 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-center">
                        <div className="space-y-3">
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md"
                            onClick={() => openRequestDialog(trip)}
                          >
                            Book Space
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Link to={`/trips/${trip.id}`} className="block">
                            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
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

      {/* Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Space on {selectedTrip?.origin_city} → {selectedTrip?.destination_city}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Goods Description</label>
              <Input 
                value={goodsDescription}
                onChange={(e) => setGoodsDescription(e.target.value)}
                placeholder="What are you shipping?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (Tonnes)</label>
              <Input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Address</label>
              <Input 
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Pickup address"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Address</label>
              <Input 
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Delivery address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={sendingRequest} className="bg-blue-600">
              {sendingRequest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseTrips;