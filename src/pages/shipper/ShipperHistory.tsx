"use client";

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, 
  Calendar, 
  IndianRupee, 
  Loader2, 
  Package, 
  Truck,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

interface HistoryItem {
  id: string;
  shipment_id: string;
  status: string;
  proposed_price_per_tonne: number;
  shipment: {
    origin_city: string;
    destination_city: string;
    weight_tonnes: number;
    budget_per_tonne: number;
    departure_date: string;
    goods_description?: string;
  };
  created_at: string;
}

const ShipperHistory = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(token);
      
      // Fetch requests for shipments belonging to this shipper
      const { data, error } = await supabase
        .from('shipment_requests')
        .select(`
          *, 
          shipment:shipments!inner(
            origin_city,
            destination_city,
            weight_tonnes,
            budget_per_tonne,
            departure_date,
            goods_description,
            shipper_id
          )
        `)
        .eq('shipment.shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      console.error('History load error:', err);
      showError('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [getToken, userProfile?.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-orange-600 mb-4" />
        <p className="text-lg font-medium text-gray-900">Please log in to view history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-orange-100">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No history yet</h3>
        <p className="text-gray-500">Your booking history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <Card key={item.id} className="border-orange-100">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold text-gray-900">
                    Shipment {item.shipment_id.slice(-6)}
                  </div>
                  {item.status === 'accepted' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {item.status === 'declined' && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                    <div>
                      <p className="text-gray-500 text-xs">Date</p>
                      <p className="font-medium">
                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-purple-600" />
                    <div>
                      <p className="text-gray-500 text-xs">Load</p>
                      <p className="font-medium">{item.shipment.weight_tonnes}t</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                    <div>
                      <p className="text-gray-500 text-xs">Offer</p>
                      <p className="font-bold text-green-600">
                        ₹{item.proposed_price_per_tonne.toLocaleString()} /t
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center md:col-span-3">
                    <Truck className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Route</p>
                      <p className="font-medium">
                        {item.shipment.origin_city} → {item.shipment.destination_city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center md:col-span-3">
                    <div className="flex items-center gap-2">
                      {item.status === 'accepted' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : item.status === 'declined' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="font-medium capitalize">{item.status}</span>
                    </div>
                  </div>
                  {item.shipment.goods_description && (
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Description</p>
                      <p className="text-sm text-gray-700">{item.shipment.goods_description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ShipperHistory;