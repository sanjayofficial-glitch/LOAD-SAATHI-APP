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
  AlertCircle,
  User,
  MapPin,
  Truck
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';
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
  
  const [filters, setFilters] = useState({
    originState: 'Any',
    destinationState: 'Any',
    minWeight: '',
    maxPrice: '',
    departureDate: ''
  });

  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;
      const supabaseClient = createClerkSupabaseClient(token);
      
      // Fetch all pending shipments and join with the users table
      // Using a simpler join syntax for better compatibility
      const { data, error } = await supabaseClient
        .from('shipments')
        .select('*, shipper:users(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) setShipments(data);
    } catch (err: any) {
      console.error('[BrowseShipments] Error:', err);
      showError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchShipments();
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
    try {
      const parsedFilters = await parseNaturalLanguageSearch(aiSearchQuery);
      if (parsedFilters.origin) setSearchTerm(parsedFilters.origin);
      if (parsedFilters.weight) setFilters(f => ({ ...f, minWeight: parsedFilters.weight!.toString() }));
      if (parsedFilters.date) setFilters(f => ({ ...f, departureDate: parsedFilters.date! }));
      showSuccess('AI parsed your search!');
    } catch (err: any) {
      showError('AI search failed');
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
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No auth token');
      const supabaseClient = createClerkSupabaseClient(token);
      
      const { error } = await supabaseClient.from('shipment_requests').insert({
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

      showSuccess('Offer sent to shipper!');
      setIsOfferDialogOpen(false);
      navigate('/trucker/my-trips?tab=sent');
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
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-blue-100 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">AI Search</Label>
                <form onSubmit={handleAiSearch} className="space-y-3">
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input 
                      placeholder="e.g. '10 tonnes from Mumbai'" 
                      className="pl-10 border-blue-100"
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600" disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    AI Search
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-700">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </CardHeader>
            {showFilters && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Origin State</Label>
                  <Select value={filters.originState} onValueChange={(val) => setFilters({...filters, originState: val})}>
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">Min Weight (t)</Label>
                  <Input type="number" value={filters.minWeight} onChange={(e) => setFilters({...filters, minWeight: e.target.value})} />
                </div>
                <Button variant="outline" className="w-full" onClick={() => {
                  setFilters({ originState: 'Any', destinationState: 'Any', minWeight: '', maxPrice: '', departureDate: '' });
                  setSearchTerm('');
                }}>Clear All</Button>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by city or goods type..." 
              className="pl-10 py-6 rounded-xl border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No shipments found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredShipments.map((shipment) => (
                <Card key={shipment.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-all">
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
                          <Badge className="bg-blue-100 text-blue-700">
                            {shipment.weight_tonnes} Tonnes
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
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
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Shipper</p>
                              <p className="font-medium">{shipment.shipper?.full_name || 'Verified Shipper'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-48 bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-2">
                        <Button className="w-full bg-orange-600" onClick={() => openOfferDialog(shipment)}>
                          Send Offer
                        </Button>
                        <Link to={`/shipper/shipments/${shipment.id}`}>
                          <Button variant="outline" className="w-full">View Details</Button>
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
              <Label>Your Price per Tonne (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="number" 
                  className="pl-10"
                  value={proposedPrice} 
                  onChange={(e) => setProposedPrice(e.target.value)} 
                />
              </div>
              <p className="text-xs text-gray-500">Shipper's budget: ₹{selectedShipment?.budget_per_tonne}/t</p>
            </div>
            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. I have a 12-wheeler available." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitOffer} className="bg-orange-600" disabled={sendingOffer}>
              {sendingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseShipments;