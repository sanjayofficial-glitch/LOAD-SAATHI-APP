"use client";

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Calendar, 
  Package, 
  ArrowRight, 
  Loader2, 
  IndianRupee,
  Filter,
  Truck,
  CheckCircle,
  AlertCircle,
  Star,
  Link,
  Plus
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    matched: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const MyShipments = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    origin: '',
    destination: '',
    minWeight: ''
  });

  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadShipments = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const supabase = await getAuthenticatedClient();
      
      let query = supabase
        .from('shipments')
        .select(`
          *, 
          requests:shipment_requests(
            id,
            status,
            proposed_price_per_tonne,
            trucker:users!shipment_requests_trucker_id_fkey(
              full_name,
              rating
            )
          )
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.origin) {
        query = query.ilike('origin_city', `%${filters.origin}%`);
      }
      if (filters.destination) {
        query = query.ilike('destination_city', `%${filters.destination}%`);
      }
      if (filters.minWeight) {
        query = query.gte('weight_tonnes', parseFloat(filters.minWeight));
      }
      if (searchTerm) {
        query = query.or(
          `origin_city.ilike.%${searchTerm}%,destination_city.ilike.%${searchTerm}%,goods_description.ilike.%${searchTerm}%,trucker.full_name.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setShipments(data || []);
    } catch (err: any) {
      console.error('Load shipments error:', err);
      showError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [getToken, getAuthenticatedClient, userProfile?.id, filters, searchTerm]);

  useEffect(() => { loadShipments(); }, [loadShipments]);

  const handleAcceptOffer = async (shipmentId: string, requestId: string, price: number) => {
    setActionLoading(requestId);
    try {
      const supabase = await getAuthenticatedClient();
      
      const { error } = await supabase
        .from('shipment_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      await supabase
        .from('shipments')
        .update({ status: 'matched' })
        .eq('id', shipmentId);

      showSuccess('Offer accepted!');
      loadShipments();
    } catch (err: any) {
      showError(err.message || 'Failed to accept offer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineOffer = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const supabase = await getAuthenticatedClient();
      
      const { error } = await supabase
        .from('shipment_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;
      showSuccess('Offer declined');
      loadShipments();
    } catch (err: any) {
      showError(err.message || 'Failed to decline offer');
    } finally {
      setActionLoading(null);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-orange-600 mb-4" />
        <p className="text-lg font-medium text-gray-900">Please log in to manage your shipments</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
          <p className="text-gray-500 mt-1">Manage your posted loads and incoming offers</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/shipper/post-shipment')}
          className="border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Post New Load
        </Button>
      </div>

      <Card className="border-orange-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search shipments..."
                className="pl-10 border-orange-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="border-orange-100">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setFilters({ status: '', origin: '', destination: '', minWeight: '' })}
              className="border-gray-200"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {shipments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
            <p className="text-gray-500 mb-6">Post your first load to get started</p>
            <Link to="/shipper/post-shipment">
              <Button className="bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Post New Load
              </Button>
            </Link>
          </div>
        ) : (
          shipments.map((shipment) => (
            <Card key={shipment.id} className="border-orange-100 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-gray-900">
                        {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
                      </div>
                      <StatusBadge status={shipment.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                        {new Date(shipment.departure_date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-purple-600" />
                        {shipment.weight_tonnes}t
                      </div>
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                        ₹{shipment.budget_per_tonne.toLocaleString()} /t
                      </div>
                      <div className="flex items-center md:col-span-3">
                        <Truck className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {shipment.shipper?.full_name || 'Shipper'}
                        </span>
                      </div>
                      <div className="flex items-center md:col-span-3">
                        <span className="text-xs text-gray-500">
                          {shipment.shipper?.rating ? `⭐ ${shipment.shipper.rating.toFixed(1)}` : 'No ratings yet'}
                        </span>
                      </div>
                    </div>

                    {shipment.goods_description && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods</p>
                        <p className="text-sm text-gray-700">{shipment.goods_description}</p>
                      </div>
                    )}
                  </div>

                  <div className="md:w-48 space-y-3">
                    {shipment.status === 'pending' && shipment.requests?.length > 0 ? (
                      <>
                        {shipment.requests.map((request: any) => (
                          <div key={request.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs">
                                  {request.trucker?.full_name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{request.trucker?.full_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {request.trucker?.rating ? `⭐ ${request.trucker.rating.toFixed(1)}` : 'No rating'}
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant={request.status === 'accepted' ? 'default' : 'secondary'}
                                className="text-xs font-semibold"
                              >
                                {request.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                              <div>
                                <p className="text-gray-400">Price</p>
                                <p className="font-semibold text-green-600">
                                  ₹{request.proposed_price_per_tonne?.toLocaleString()} /t
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Weight</p>
                                <p className="font-semibold">{request.weight_tonnes}t</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {request.status === 'pending' && (
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleAcceptOffer(shipment.id, request.id, request.proposed_price_per_tonne)}
                                  disabled={actionLoading === request.id}
                                >
                                  {actionLoading === request.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Accept
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeclineOffer(request.id)}
                                disabled={actionLoading === request.id}
                              >
                                {actionLoading === request.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {shipment.status === 'pending' ? (
                          <>
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No offers yet</p>
                            <p className="text-xs">Share your shipment to get offers from truckers</p>
                          </>
                        ) : shipment.status === 'matched' ? (
                          <>
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                            <p className="font-semibold">Shipment Matched!</p>
                            <p className="text-xs">Trucker is on the way</p>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No shipments found</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MyShipments;