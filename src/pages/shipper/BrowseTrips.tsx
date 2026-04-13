"use client";

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  MapPin,   Calendar, 
  IndianRupee, 
  Search, 
  ArrowRight as ArrowRightIcon,
  Loader2,
  Sparkles,
  Filter,
  X,
  AlertCircle,
  Truck
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useQuery } from '@tanstack/react-query';
import { parseNaturalLanguageSearch } from '@/lib/gemini';
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import locationData from '@/data/locations.json';
import { sendNotification } from '@/utils/notifications';

const INDIAN_STATES = Object.keys(locationData.data);

const BrowseTrips = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minCapacity: '',
    maxPrice: '',
    date: ''
  });

  // Request Dialog State
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [goodsDescription, setGoodsDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const { data: trips = [], isLoading: loading } = useQuery({
    queryKey: ['trips', 'active'],
    queryFn: async () => {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Trip[];
    },
    enabled: !!userProfile,
    staleTime: 1000 * 60 * 2,
  });

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setApiKeyMissing(false);
    
    try {
      const parsedFilters = await parseNaturalLanguageSearch(aiQuery);
      
      if (Object.keys(parsedFilters).length > 0) {
        setFilters({
          origin: parsedFilters.origin || '',
          destination: parsedFilters.destination || '',
          minCapacity: parsedFilters.weight?.toString() || '',
          maxPrice: '',
          date: parsedFilters.date || ''
        });
        setShowFilters(true);
        showSuccess('AI parsed your search filters!');
      } else {
        showError('AI could not understand the search. Try being more specific.');
      }
    } catch (err: any) {
      if (err.message === 'GEMINI_API_KEY_MISSING') {
        setApiKeyMissing(true);
        showError('AI Search requires a Gemini API Key.');
      } else {
        showError('AI search failed. Please try manual filters.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    let result = [...trips];

    if (filters.origin) {
      result = result.filter(t => 
        t.origin_city.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    if (filters.destination) {
      result = result.filter(t => 
        t.destination_city.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.minCapacity) {
      const minCap = parseFloat(filters.minCapacity);
      result = result.filter(t => t.available_capacity_tonnes >= minCap);
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      result = result.filter(t => t.price_per_tonne <= maxPrice);
    }

    if (filters.date) {
      result = result.filter(t => {
        const tripDate = new Date(t.departure_date).toISOString().split('T')[0];
        return tripDate >= filters.date;
      });
    }

    return result;
  }, [trips, filters]);

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      minCapacity: '',
      maxPrice: '',
      date: ''
    });
  };

  const openRequestDialog = (trip: any) => {
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
      showError(`Exceeds available capacity (${selectedTrip.available_capacity_tonnes}t)`);
      return;
    }

    setSendingRequest(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabaseClient = createClerkSupabaseClient(supabaseToken);

      const { error } = await supabaseClient
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

      // Notify the trucker
      await sendNotification({
        userId: selectedTrip.trucker_id,
        message: `${userProfile.full_name} requested ${requestedWeight}t for your trip from ${selectedTrip.origin_city} to ${selectedTrip.destination_city}`,
        getToken: () => getToken({ template: 'supabase' }),
        relatedTripId: selectedTrip.id
      });

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading available trips...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Available Trucks</h1>
          <p className="text-gray-600 text-lg">Search and book truck space for your shipments</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-blue-100 shadow-lg">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">AI Search</label>
                    <form onSubmit={handleAiSearch} className="relative">
                      <div className="relative">
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                        <input
                          type="text"
                          placeholder="e.g. '2 tonnes from Mumbai to Pune now'"
                          className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                        disabled={aiLoading}
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            AI Search
                          </>
                        )}
                      </Button>
                    </form>
                    
                    {apiKeyMissing && (
                      <Alert variant="destructive" className="mt-4 bg-red-50 border-red-100">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          AI Search is disabled. Please add <strong>VITE_GEMINI_API_KEY</strong> to your environment variables.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-gray-700">Manual Filters</label>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showFilters ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {showFilters && (
                      <div className="space-y-4 animate-in slide-in-from-top duration-200">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Origin State</label>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.origin}
                            onChange={(e) => setFilters({...filters, origin: e.target.value})}
                          >
                            <option value="">Any</option>
                            {INDIAN_STATES.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Destination State</label>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.destination}
                            onChange={(e) => setFilters({...filters, destination: e.target.value})}
                          >
                            <option value="">Any</option>
                            {INDIAN_STATES.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Min Capacity (Tonnes)</label>
                          <input
                            type="number"
                            placeholder="e.g. 5"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.minCapacity}
                            onChange={(e) => setFilters({...filters, minCapacity: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Max Price per Tonne (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 3000"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Departure From</label>
                          <input
                            type="date"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.date}
                            onChange={(e) => setFilters({...filters, date: e.target.value})}
                          />
                        </div>

                        <Button 
                          onClick={clearFilters}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Trips</span>
                        <span className="font-bold text-blue-600">{trips.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Filtered Results</span>
                        <span className="font-bold text-green-600">{filteredTrips.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Available Trips                  <Badge variant="outline" className="ml-3 bg-blue-50 text-blue-700 border-blue-200">
                    {filteredTrips.length} found
                  </Badge>
                </h2>
              </div>
              <div className="text-sm text-gray-500">
                Sorted by: Newest first              </div>
            </div>

            {filteredTrips.length === 0 ? (
              <Card className="border-blue-100">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
                    <Button 
                      onClick={clearFilters}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredTrips.map((trip) => (
                  <Card key={trip.id} className="overflow-hidden border-blue-100 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-3 rounded-full">
                                <Truck className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {trip.origin_city} → {trip.destination_city}
                                </h3>
                                <p className="text-sm text-gray-600">{trip.vehicle_type}</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Available                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                              <div>
                                <p className="text-gray-500 text-xs">Departure</p>
                                <p className="font-medium">
                                  {new Date(trip.departure_date).toLocaleDateString('en-IN', { 
                                    day: 'numeric', 
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-indigo-600" />
                              <div>
                                <p className="text-gray-500 text-xs">Capacity</p>
                                <p className="font-bold text-indigo-600">{trip.available_capacity_tonnes} tonnes</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-blue-800 font-medium uppercase mb-1">Price per tonne</p>
                                <div className="flex items-center text-2xl font-bold text-blue-600">
                                  <IndianRupee className="h-5 w-5 mr-1" />
                                  {trip.price_per_tonne.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Vehicle</p>
                                <p className="text-sm font-medium text-gray-900">{trip.vehicle_number}</p>
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
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
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
      </div>

      {/* Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Truck Space</DialogTitle>
            <DialogDescription>
              Send a booking request for the trip from {selectedTrip?.origin_city} to {selectedTrip?.destination_city}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight to Book (Tonnes)</Label>
              <Input 
                id="weight"
                type="number" 
                step="0.1"
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                placeholder={`Max ${selectedTrip?.available_capacity_tonnes}t`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goods">Goods Description</Label>
              <Textarea 
                id="goods"
                value={goodsDescription} 
                onChange={(e) => setGoodsDescription(e.target.value)} 
                placeholder="e.g. 50 bags of cement, electronics, etc."
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup Address</Label>
              <Input 
                id="pickup"
                value={pickupAddress} 
                onChange={(e) => setPickupAddress(e.target.value)} 
                placeholder="Full pickup address" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery Address</Label>
              <Input 
                id="delivery"
                value={deliveryAddress} 
                onChange={(e) => setDeliveryAddress(e.target.value)} 
                placeholder="Full delivery address" 
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-bold text-blue-700">
                  ₹{((parseFloat(weight) || 0) * (selectedTrip?.price_per_tonne || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)} disabled={sendingRequest}>Cancel</Button>
            <Button 
              onClick={submitRequest} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={sendingRequest || !weight || !goodsDescription}
            >
              {sendingRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseTrips;