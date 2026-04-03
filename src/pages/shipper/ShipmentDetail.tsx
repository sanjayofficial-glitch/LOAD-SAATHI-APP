"use client";

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import RouteMap from '@/components/RouteMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  ArrowLeft, 
  Loader2
} from 'lucide-react';
import { showError } from '@/utils/toast';

const ShipmentDetail = () => {
  const { id } = useParams();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

      if (shipmentError) throw shipmentError;
      setShipment(shipmentData);
    } catch (error: any) {
      console.error('[ShipmentDetail] Error:', error);
      showError(error.message || 'Failed to load shipment details');
      navigate('/shipper/my-shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (!shipment) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Shipments
      </Button>

      {/* Route Map */}
      <div className="mb-8">
        <RouteMap originCity={shipment.origin_city} destinationCity={shipment.destination_city} height="260px" />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
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

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Shipment Status</CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-4">
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <p>Your shipment is currently <strong>{shipment.status}</strong>.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <p>Truckers can view your shipment and express interest through the Browse Shipments page.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <p>Once matched, you'll receive notifications and contact details.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetail;