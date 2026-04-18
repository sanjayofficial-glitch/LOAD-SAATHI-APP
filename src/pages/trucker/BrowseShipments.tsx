"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
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
  Filter,
  X,
  Eye,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';
import { parseNaturalLanguageSearch } from '@/lib/gemini';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { notifyShipperOfTruckerOffer } from '@/utils/notifications';
import { Alert, AlertDescription } from "@/components/ui/alert";

const INDIAN_STATES = [
  "Any", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  const [filters, setFilters] = useState({
    originState: 'Any',
    destinationState: 'Any',
    minWeight: '',
    maxPrice: '',
    departureDate: ''
  });

  // Offer Dialog State
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  const fetchShipments = useCallback(async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;
      const supabaseClient = createClerkSupabaseClient(token);
      const { data, error } = await supabaseClient
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (!error && data) setShipments(data);
    } catch (err) {
      showError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchShipments();

    const channel = supabase
      .channel('browse-shipments-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shipments', filter: "status=eq.pending" },
        () => fetchShipments()
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shipments' },
        () => fetchShipments()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchShipments]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = s.origin_city.toLowerCase().includes(search) || 
                           s.destination_city.toLowerCase().includes(search) ||
                           s.goods_description.toLowerCase().includes(search);
      
      const matchesOrigin = filters.originState === 'Any' || (s.origin_state && s.origin_state === filters.originState);
      const matchesDest = filters.destinationState === 'Any' || (s.destination_state && s.destination_state === filters.destinationState);
      const matchesWeight = !filters.minWeight || s.weight_tonnes >= parseFloat(filters.minWeight);
      const matchesPrice = !filters.maxPrice || s.budget_per_tonne <= parseFloat(filters.maxPrice);
      const matchesDate = !filters.departureDate || new Date(s.departure_date) >= new Date(filters.departureDate);
      
      return matchesSearch && matchesOrigin && matchesDest && matchesWeight && matchesPrice && matchesDate;
    });
  }, [shipments, searchTerm, filters]);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;

    setAiLoading(true);
    setApiKeyMissing(false);
    
    try {
      const parsedFilters = await parseNaturalLanguageSearch(aiSearchQuery);
      
      if (Object.keys(parsedFilters).length > 0) {
        setFilters({
          originState: 'Any', // AI returns city names, we keep state as Any for broad match
          destinationState: 'Any',
          minWeight: parsedFilters.weight?.toString() || '',
          maxPrice: '',
          departureDate: parsedFilters.date || ''
        });
        setSearchTerm(parsedFilters.origin || parsedFilters.destination || '');
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
      
      const supabaseClient = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabaseClient
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

      await notifyShipperOfTruckerOffer({
        shipperId: selectedShipment.shipper_id,
        truckerName: userProfile.full_name || 'A trucker',
        proposedPrice: price,
        weightTonnes: selectedShipment.weight_tonnes,
        originCity: selectedShipment.origin_city,
        destinationCity: selectedShipment.destination_city,
        getToken: () => getToken({ template: 'supabase' }),
      });

      showSuccess('🚛 Offer sent to shipper! They will be notified instantly.');
      setIsOfferDialogOpen(false);
      setProposedPrice('');
      setMessage('');
      navigate('/trucker/dashboard?tab=sent');
    } catch (err: any) {
      showError(err.message || 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Find Goods to Carry</h1>
        <p className="text-gray-600 mt-2">Browse available shipments posted by shippers and send your best offer</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Search Card */}
          <Card className="border-blue-100 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">AI Search</Label>
                <form onSubmit={handleAiSearch} className="space-y-3">
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input 
                      placeholder="e.g. '10 tonnes from Mumbai to Delhi next week'" 
                      className="pl-10 border-blue-100 focus:ring-blue-500"
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    disabled={aiLoading}
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    AI Search
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
            </CardContent>
          </Card>

          {/* Manual Filters Card */}
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-700">Manual Filters</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </CardHeader>
            {showFilters && (
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Origin State</Label>
                  <Select 
                    value={filters.originState} 
                    onValueChange={(val) => setFilters({...filters, originState: val})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Destination State</Label>
                  <Select 
                    value={filters.destinationState} 
                    onValueChange={(val) => setFilters({...filters, destinationState: val})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Min Capacity (Tonnes)</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 5" 
                    value={filters.minWeight}
                    onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Max Price per Tonne (₹)</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 3000" 
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Departure From</Label>
                  <div className="relative">
                    <Input 
                      type="date" 
                      className="w-full"
                      value={filters.departureDate}
                      onChange={(e) => setFilters({...filters, departureDate: e.target.value})}
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-gray-200 text-gray-600"
                  onClick={() => {
                    setFilters({
                      originState: 'Any',
                      destinationState: 'Any',
                      minWeight: '',
                      maxPrice: '',
                      departureDate: ''
                    });
                    setSearchTerm('');
                  }}
                >
                  <X className="h-4 w-4 mr-2" /> Clear All
                </Button>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Shipments List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by city or goods type..." 
              className="pl-10 py-6 rounded-xl border-gray-200 focus:ring-orange-500"
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

                      <div className="md:w-48 bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-2">
                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700 shadow-md"
                          onClick={() => openOfferDialog(shipment)}
                        >
                          Send Offer
                          <Send className="ml-2 h-4 w-4" />
                        </Button>
                        <Link to={`/shipper/shipments/${shipment.id}`} className="block">
                          <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Button>
                        </Link>
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