import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { showError } from '@/utils/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Calendar, Package, IndianRupee, ArrowRight, Truck, Loader2, Send } from 'lucide-react';
import { sendNotification } from '@/utils/notifications';

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingOffer, setSendingOffer] = useState<string | null>(null);
  const [offerModal, setOfferModal] = useState<{ shipment: any; price: string; message: string } | null>(null);

  const fetchShipments = async () => {
    try {
      const supabaseToken = await getToken({ template: 'supabase' }); // ✅ Fixed missing closing parenthesis
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      // Fetch available shipments (pending status) from shippers
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          shipper:users(id, full_name, phone, rating)
        `)
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

  const handleSendOffer = async () => {
    if (!offerModal || !userProfile) return;

    const price = parseFloat(offerModal.price);
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price');
      return;
    }

    setSendingOffer(offerModal.shipment.id);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('shipment_requests')
        .insert({
          shipment_id: offerModal.shipment.id,
          trucker_id: userProfile.id,
          proposed_price_per_tonne: price,
          message: offerModal.message.trim(),
          status: 'pending'
        });

      if (error) throw error;

      // Send notification to shipper
      await sendNotification({
        userId: offerModal.shipment.shipper_id,
        message: `${userProfile.full_name} offered ₹${price}/t for your ${offerModal.shipment.weight_tonnes}t shipment from ${offerModal.shipment.origin_city} to ${offerModal.shipment.destination_city}`,
        getToken: () => getToken({ template: 'supabase' })
      });

      setOfferModal(null);
      navigate('/trucker/my-requests?tab=sent');
    } catch (err: any) {
      showError(err.message || 'Failed to send offer');
    } finally {
      setSendingOffer(null);
    }
  };

  const filteredShipments = shipments.filter(s => {
    const search = searchTerm.toLowerCase();
    return (
      s.origin_city?.toLowerCase().includes(search) ||
      s.destination_city?.toLowerCase().includes(search) ||
      s.goods_description?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Goods to Carry</h1>
        <p className="text-gray-600">Browse available shipments posted by shippers and send your best offer</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by origin, destination, or goods type..."
            className="pl-10 h-12 text-lg border-orange-200 focus:ring-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No shipments available</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No shipments match your search. Try different keywords.' : 'Check back later for new shipments from shippers.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShipments.map((shipment) => (
            <Card key={shipment.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="bg-orange-50/50 pb-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-100 text-green-700">Available</Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(shipment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center mt-2">
                  {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4 pt-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                    <span className="font-medium">{new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="font-medium">{shipment.weight_tonnes} Tonnes</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                    <span className="font-medium">Budget: ₹{shipment.budget_per_tonne.toLocaleString()}/t</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods</p>
                    <p className="text-sm text-gray-700">{shipment.goods_description}</p>
                  </div>
                  {shipment.pickup_address && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pickup</p>
                      <p className="text-xs text-gray-600">{shipment.pickup_address}</p>
                    </div>
                  )}
                  {shipment.delivery_address && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Delivery</p>
                      <p className="text-xs text-gray-600">{shipment.delivery_address}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t mt-auto">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setOfferModal({ shipment, price: '', message: '' })}
                  >
                    <Send className="h-4 w-4 mr-2" /> Send Offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Send Your Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg space-y-2">
                <p className="font-bold text-gray-900">{offerModal.shipment.origin_city} → {offerModal.shipment.destination_city}</p>
                <p className="text-sm text-gray-600">{offerModal.shipment.weight_tonnes}t • {offerModal.shipment.goods_description}</p>
                <p className="text-xs text-gray-500">Shipper's Budget: ₹{offerModal.shipment.budget_per_tonne}/t</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Price (₹/tonne)</label>
                <Input                  type="number"
                  placeholder="Enter your price per tonne"
                  value={offerModal.price}
                  onChange={(e) => setOfferModal({ ...offerModal, price: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message (Optional)</label>
                <Input
                  placeholder="Add a message to the shipper..."
                  value={offerModal.message}
                  onChange={(e) => setOfferModal({ ...offerModal, message: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setOfferModal(null)} disabled={!!sendingOffer}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={handleSendOffer} disabled={sendingOffer !== null && sendingOffer !== undefined || offerModal.price === ''}>
                  {sendingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Offer'}
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