import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Package, ArrowRight, Loader2, IndianRupee, Filter } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';
import { parseNaturalLanguageSearch } from '@/lib/gemini';
import { notifyShipperOfTruckerOffer } from '@/utils/notifications';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { LocationSelector } from '@/components/LocationSelector';
import locationData from '@/data/locations.json';
import styles from '../components/TripStatusButton.module.css';
import { TripStatusButton } from '../components/TripStatusButton';

const INDIAN_STATES = [
  "Any", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const BrowseTrips = () => {
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

  const fetchShipments = useCallback(async () => {
    try {
      const token = await getToken();
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

    const channel = supabase      .channel('browse-shipments-realtime')
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

  const openOfferDialog = (shipment: any) => {
    setSelectedShipment(shipment);
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
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      
      const supabaseClient = createClerkSupabaseClient(token);
      
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
        getToken: () => getToken(),
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Goods to Carry</h1>
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
                {apiKeyMissing && ((
                  <Alert variant="destructive" className="mt-4 bg-red-50 border-red-100">
                    <AlertCircle className="h-4 w-4" /> 
                    <AlertDescription className="text-xs">
                      AI Search is disabled. Please add <strong>VITE_GEMINI_API_KEY</strong> to your environment variables.
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card> 
        </div>

        {/* Shipments List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by city or goods type..."               className="pl-10 py-6 rounded-xl border-gray-200 focus:ring-orange-500"
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
                            {shipment.weight_tonnes} Tonnes                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Departure</p>
                              <p className="font-medium">{new Date(shipment.departure_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 mr-2 text-blue-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Capacity</p>
                              <p className="font-bold text-blue-600">{shipment.available_capacity_tonnes} tonnes</p>
                            </div>
                          </div>
                        </div> 

                        <div className="md:w-48 bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center">
                          <div className="space-y-3">
                            <Button 
                              className="w-full bg-orange-600 hover:bg-orange-700 shadow-md"                               onClick={() => openOfferDialog(shipment)}
                            >
                              Send Offer
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            {shipment.status === 'pending' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogHeader>
                                    <AlertDialogDescription>
                                      This will permanently delete your shipment listing.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteShipment(shipment.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  type="number"                   className="pl-10" 
                  value={proposedPrice}                   onChange={(e) => setProposedPrice(e.target.value)} 
                />
              </div>
              <p className="text-xs text-gray-500">Shipper's budget: ₹{selectedShipment?.budget_per_tonne}/t</p>
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
              ) : 'Send Offer' 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseShipments;