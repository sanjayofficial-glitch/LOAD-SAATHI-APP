"use client";

import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Search, 
  ArrowRight,
  Loader2,
  Sparkles,
  Filter,
  X,
  AlertCircle,
  ArrowRight as ArrowRightIcon
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

const INDIAN_CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Pune', 'Surat', 'Kanpur',
  'Jaipur', 'Lucknow', 'Nagpur', 'Coimbatore', 'Gurgaon', 'Visakhapatnam', 'Indore', 'Thane', 'Noida', 'Ghaziabad',
  'Jammu', 'Gwalior', 'Chandigarh', 'Mysore', 'Amritsar', 'Vadodara', 'Patna', 'Jabalpur', 'Ludhiana', 'Agra', 
  'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kochi', 'Jalandhar', 'Moradabad', 'Tiruchirappalli', 'Solapur', 
  'Jamshedpur', 'Kalyan-Dombivli', 'Bhilai', 'Ranchi', 'Amravati', 'Durgapur'
];

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minWeight: '',
    maxBudget: '',
    date: ''
  });

  // Request Dialog State
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestPrice, setRequestPrice] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

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
          minWeight: parsedFilters.weight?.toString() || '',
          maxBudget: '',
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

  const filteredShipments = useMemo(() => {
    let result = [...shipments];

    if (filters.origin) {
      result = result.filter(s => 
        s.origin_city.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    if (filters.destination) {
      result = result.filter(s => 
        s.destination_city.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.minWeight) {
      const minW = parseFloat(filters.minWeight);
      result = result.filter(s => s.weight_tonnes >= minW);
    }

    if (filters.maxBudget) {
      const maxB = parseFloat(filters.maxBudget);
      result = result.filter(s => s.budget_per_tonne <= maxB);
    }

    if (filters.date) {
      result = result.filter(s => {
        const shipmentDate = new Date(s.departure_date).toISOString().split('T')[0];
        return shipmentDate >= filters.date;
      });
    }

    return result;
  }, [shipments, filters]);

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      minWeight: '',
      maxBudget: '',
      date: ''
    });
  };

  const openRequestDialog = (shipment: any) => {
    setSelectedShipment(shipment);
    setIsRequestDialogOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedShipment || !userProfile) return;
    setSendingRequest(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabaseClient = createClerkSupabaseClient(supabaseToken);

      const { error } = await supabaseClient
        .from('shipment_requests')
        .insert({
          shipment_id: selectedShipment.id,
          trucker_id: userProfile.id,
          shipper_id: selectedShipment.shipper_id,
          message: requestMessage.trim(),
          proposed_price_per_tonne: requestPrice ? parseFloat(requestPrice) : null,
          status: 'pending'
        });

      if (error) throw error;

      showSuccess('Request sent! The shipper will be notified.');
      setIsRequestDialogOpen(false);
      setRequestMessage('');
      setRequestPrice('');
    } catch (err: any) {
      showError(err.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-10 w-10 text-orange-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading available shipments...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Goods to Carry</h1>
          <p className="text-gray-600 text-lg">Browse shipments from verified shippers across India</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-orange-100 shadow-lg">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">AI Search</label>
                    <form onSubmit={handleAiSearch} className="relative">
                      <div className="relative">
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-600" />
                        <input
                          type="text"
                          placeholder="e.g. '5 tonnes from Delhi to Jaipur tomorrow'"
                          className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
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
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {showFilters ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {showFilters && (
                      <div className="space-y-4 animate-in slide-in-from-top duration-200">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Origin City</label>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.origin}
                            onChange={(e) => setFilters({...filters, origin: e.target.value})}
                          >
                            <option value="">Any</option>
                            {INDIAN_CITIES.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Destination City</label>
                          <select
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.destination}
                            onChange={(e) => setFilters({...filters, destination: e.target.value})}
                          >
                            <option value="">Any</option>
                            {INDIAN_CITIES.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Min Weight (Tonnes)</label>
                          <input
                            type="number"
                            placeholder="e.g. 2"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.minWeight}
                            onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Max Budget per Tonne (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            className="w-full p-2 border border-gray-200 rounded-md text-sm"
                            value={filters.maxBudget}
                            onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Ready From</label>
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
                    <h3 className="font-semibold text-gray-900 mb-3">Market Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Shipments</span>
                        <span className="font-bold text-orange-600">{shipments.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Matching Your Search</span>
                        <span className="font-bold text-green-600">{filteredShipments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Loads
                <Badge variant="outline" className="ml-3 bg-orange-50 text-orange-700 border-orange-200">
                  {filteredShipments.length} found
                </Badge>
              </h2>
            </div>

            {filteredShipments.length === 0 ? (
              <Card className="border-orange-100">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No shipments found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
                    <Button 
                      onClick={clearFilters}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredShipments.map((shipment) => (
                  <Card key={shipment.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-orange-100 p-3 rounded-full">
                                <Package className="h-6 w-6 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {shipment.origin_city} → {shipment.destination_city}
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
                                  {new Date(shipment.departure_date).toLocaleDateString('en-IN', { 
                                    day: 'numeric', 
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                              <div>
                                <p className="text-gray-500 text-xs">Pickup</p>
                                <p className="font-medium truncate max-w-[150px]">{shipment.pickup_address}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-orange-800 font-medium uppercase mb-1">Budget per tonne</p>
                                <div className="flex items-center text-2xl font-bold text-orange-600">
                                  <IndianRupee className="h-5 w-5 mr-1" />
                                  {shipment.budget_per_tonne.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Shipper</p>
                                <p className="text-sm font-medium text-gray-900">{shipment.shipper?.full_name || 'Verified Shipper'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-64 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-center">
                          <div className="space-y-3">
                            <Button 
                              className="w-full bg-orange-600 hover:bg-orange-700 shadow-md"
                              onClick={() => openRequestDialog(shipment)}
                            >
                              Send Request
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                            <p className="text-xs text-gray-500 text-center">
                              Express interest to get contact details
                            </p>
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
            <DialogTitle>Send Booking Request</DialogTitle>
            <DialogDescription>
              Express interest in carrying {selectedShipment?.goods_description} from {selectedShipment?.origin_city} to {selectedShipment?.destination_city}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Proposed Price per Tonne (₹)</label>
              <Input 
                type="number" 
                value={requestPrice} 
                onChange={(e) => setRequestPrice(e.target.value)} 
                placeholder="e.g. 2500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message to Shipper</label>
              <Textarea 
                value={requestMessage} 
                onChange={(e) => setRequestMessage(e.target.value)} 
                placeholder="e.g. I have a 12-wheeler available on this route..."
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)} disabled={sendingRequest}>Cancel</Button>
            <Button 
              onClick={submitRequest} 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={sendingRequest}
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

export default BrowseShipments;