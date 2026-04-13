"use client";

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import RouteMap from '@/components/RouteMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Package, MapPin, Calendar, IndianRupee, ArrowLeft, Loader2,
  Edit, Send, Star, Building2, Truck, IndianRupee as RupeeIcon,
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { notifyShipperOfTruckerOffer } from '@/utils/notifications';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const ShipmentDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offerCount, setOfferCount] = useState(0);

  // Offer dialog state (for truckers)
  const [offerOpen, setOfferOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);

      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*, shipper:users!shipments_shipper_id_fkey(*)')
        .eq('id', id)
        .single();

      if (shipmentError) throw shipmentError;
      setShipment(shipmentData);

      // Count offers received (only visible to owner)
      if (userProfile?.id === shipmentData.shipper_id) {
        const { count } = await supabase
          .from('shipment_requests')
          .select('*', { count: 'exact', head: true })
          .eq('shipment_id', id);
        setOfferCount(count ?? 0);
      }
    } catch (error: any) {
      console.error('[ShipmentDetail] Error:', error);
      showError(error.message || 'Failed to load shipment details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, userProfile?.id]);

  const handleSendOffer = async () => {
    if (!userProfile || !shipment) return;
    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) { showError('Enter a valid price'); return; }

    setSendingOffer(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No auth token');
      const supabase = createClerkSupabaseClient(token);

      const { error } = await supabase.from('shipment_requests').insert({
        shipment_id: shipment.id,
        trucker_id: userProfile.id,
        shipper_id: shipment.shipper_id,
        proposed_price_per_tonne: price,
        message: offerMessage.trim() || null,
        status: 'pending',
      });
      if (error) throw error;

      await notifyShipperOfTruckerOffer({
        shipperId: shipment.shipper_id,
        truckerName: userProfile.full_name || 'A trucker',
        proposedPrice: price,
        weightTonnes: shipment.weight_tonnes,
        originCity: shipment.origin_city,
        destinationCity: shipment.destination_city,
        getToken: () => getToken({ template: 'supabase' }),
      });

      showSuccess('✅ Offer sent! The shipper has been notified.');
      setOfferOpen(false);
      setProposedPrice('');
      setOfferMessage('');
    } catch (err: any) {
      showError(err.message || 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (!shipment) return null;

  const isOwner = userProfile?.id === shipment.shipper_id;
  const isTrucker = userProfile?.user_type === 'trucker';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          {isOwner && (
            <Link to={`/shipper/shipments/${id}/edit`}>
              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Edit className="mr-2 h-4 w-4" /> Edit Shipment
              </Button>
            </Link>
          )}
          {isTrucker && (
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setOfferOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" /> Send Offer
            </Button>
          )}
        </div>
      </div>

      {/* Route Map */}
      <div className="mb-8 rounded-2xl overflow-hidden">
        <RouteMap originCity={shipment.origin_city} destinationCity={shipment.destination_city} height="260px" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {shipment.origin_city} → {shipment.destination_city}
                </CardTitle>
                <Badge className={
                  shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  shipment.status === 'matched' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {shipment.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Departure Date</p>
                  <div className="flex items-center font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    {new Date(shipment.departure_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Weight</p>
                  <div className="flex items-center font-medium">
                    <Package className="h-4 w-4 mr-2 text-purple-600" />
                    {shipment.weight_tonnes} Tonnes
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold">Budget</p>
                  <div className="flex items-center font-bold text-green-600">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {shipment.budget_per_tonne.toLocaleString()} /t
                  </div>
                </div>
                {isOwner && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-bold">Offers Received</p>
                    <div className="flex items-center font-bold text-orange-600">
                      <Truck className="h-4 w-4 mr-2" />
                      {offerCount} offer{offerCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods Description</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{shipment.goods_description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pickup Address</p>
                    <p className="text-sm text-gray-600 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                      {shipment.pickup_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-600 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      {shipment.delivery_address}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipper Info (for truckers browsing) */}
          {isTrucker && shipment.shipper && (
            <Card className="border-orange-100">
              <CardHeader className="bg-orange-50/50 pb-3">
                <CardTitle className="text-sm font-bold uppercase text-gray-500">Shipper Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                    {shipment.shipper?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{shipment.shipper?.full_name}</p>
                    {shipment.shipper?.company_name && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {shipment.shipper.company_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-sm text-yellow-500 gap-1">
                  <Star className="h-4 w-4" />
                  <span className="font-medium text-gray-700">{shipment.shipper?.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400">rating</span>
                </div>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => setOfferOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" /> Send Offer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Status card for owner */}
          {isOwner && (
            <Card>
              <CardHeader><CardTitle>Shipment Status</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-4">
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <p>Your shipment is currently <strong>{shipment.status}</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <p>Truckers can view and send offers. You have <strong>{offerCount} offer{offerCount !== 1 ? 's' : ''}</strong> so far.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <p>Go to <strong>My Shipments → Incoming</strong> tab to review and accept offers.</p>
                </div>
                {offerCount > 0 && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                    onClick={() => navigate('/shipper/my-shipments?tab=incoming')}
                  >
                    Review Offers ({offerCount})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Offer Dialog (for truckers) */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Send Offer to Shipper</DialogTitle>
            <DialogDescription>
              Propose your price for {shipment.weight_tonnes}t of {shipment.goods_description}<br />
              from {shipment.origin_city} → {shipment.destination_city}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="price">Your Price per Tonne (₹)</Label>
              <div className="relative">
                <RupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="price"
                  type="number"
                  className="pl-10"
                  value={proposedPrice}
                  onChange={e => setProposedPrice(e.target.value)}
                  placeholder={`Shipper budget: ₹${shipment.budget_per_tonne}/t`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg">Message (optional)</Label>
              <Input
                id="msg"
                value={offerMessage}
                onChange={e => setOfferMessage(e.target.value)}
                placeholder="e.g. 12-wheeler available, can depart same day"
              />
            </div>
            {proposedPrice && (
              <div className="bg-orange-50 p-3 rounded-lg text-sm flex justify-between">
                <span className="text-gray-600">Total offer:</span>
                <span className="font-bold text-orange-700">
                  ₹{((parseFloat(proposedPrice) || 0) * shipment.weight_tonnes).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferOpen(false)} disabled={sendingOffer}>Cancel</Button>
            <Button
              onClick={handleSendOffer}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={sendingOffer || !proposedPrice}
            >
              {sendingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipmentDetail;