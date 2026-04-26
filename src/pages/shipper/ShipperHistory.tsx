"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Clock, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Filter,
  Eye,
  CheckCircle,
  Search,
  Loader2,
  Send,
  IndianRupee,
  AlertCircle
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'shipment' | 'request';
  date: string;
  title: string;
  description: string;
  status: string;
  counterparty: string;
  amount: number;
  weight: number;
}

const ShipperHistory = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ["shipperHistory", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) {
        console.log('[ShipperHistory] No user profile');
        return [];
      }
      
      console.log('[ShipperHistory] Fetching history for user:', userProfile.id);
      
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) {
        console.error('[ShipperHistory] No Supabase token');
        throw new Error('No Supabase token');
      }
      const supabase = createClerkSupabaseClient(supabaseToken);

      try {
        // Fetch shipments
        const { data: shipmentsData, error: shipmentsError } = await supabase
          .from('shipments')
          .select('*')
          .eq('shipper_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (shipmentsError) {
          console.error('[ShipperHistory] Shipments error:', shipmentsError);
        }

        // Fetch requests (booking requests sent to truckers)
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select(`
            id,
            created_at,
            status,
            weight_tonnes,
            goods_description,
            trip:trips(
              id,
              origin_city,
              destination_city,
              price_per_tonne
            )
          `)
          .eq('shipper_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.error('[ShipperHistory] Requests error:', requestsError);
        }

        console.log('[ShipperHistory] Shipments:', shipmentsData?.length, 'Requests:', requestsData?.length);

        const items: ActivityItem[] = [];

        // Process shipments
        if (shipmentsData) {
          shipmentsData.forEach((s: any) => {
            items.push({
              id: s.id,
              type: 'shipment',
              date: s.created_at || new Date().toISOString(),
              title: `${s.origin_city || 'Unknown'} → ${s.destination_city || 'Unknown'}`,
              description: s.goods_description || 'No description',
              status: s.status || 'pending',
              counterparty: 'Multiple Truckers',
              amount: Number(s.budget_per_tonne) || 0,
              weight: Number(s.weight_tonnes) || 0
            });
          });
        }

        // Process requests
        if (requestsData) {
          requestsData.forEach((r: any) => {
            items.push({
              id: r.id,
              type: 'request',
              date: r.created_at || new Date().toISOString(),
              title: `Booking: ${r.trip?.origin_city || 'Unknown'} → ${r.trip?.destination_city || 'Unknown'}`,
              description: r.goods_description || 'No description',
              status: r.status || 'pending',
              counterparty: 'Verified Trucker',
              amount: Number(r.trip?.price_per_tonne) || 0,
              weight: Number(r.weight_tonnes) || 0
            });
          });
        }

        // Sort by date descending
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log('[ShipperHistory] Total activities:', items.length);
        return items;
      } catch (err) {
        console.error('[ShipperHistory] Error fetching data:', err);
        throw err;
      }
    },
    enabled: !!userProfile?.id,
    retry: 1,
    staleTime: 30000,
  });

  const filteredActivities = activities.filter(activity => {
    if (filters.type !== 'all' && activity.type !== filters.type) return false;
    if (filters.status !== 'all' && activity.status !== filters.status) return false;
    return true;
  });

  const getStatusBadge = (status: string = 'pending') => {
    const s = status.toLowerCase();
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      completed: { variant: 'default', className: 'bg-green-100 text-green-800' },
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      matched: { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      accepted: { variant: 'default', className: 'bg-green-100 text-green-800' },
      declined: { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'outline', className: 'bg-gray-100 text-gray-800' },
      active: { variant: 'default', className: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[s] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading History</h3>
            <p className="text-gray-500 mb-4">There was a problem loading your activity history.</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
        <p className="text-gray-600">View all your past shipments and booking requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.status === 'completed' || a.status === 'accepted' || a.status === 'matched').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {activities.filter(a => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {activities.filter(a => {
                const d = new Date(a.date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
              <Select value={filters.type} onValueChange={(v) => setFilters({...filters, type: v})}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="shipment">Posted Loads</SelectItem>
                  <SelectItem value="request">Sent Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={() => setFilters({type: 'all', status: 'all'})}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No activities found</h3>
            <p className="text-gray-500">
              {activities.length === 0 
                ? "You haven't posted any shipments or sent any requests yet." 
                : "Try adjusting your filters."}
            </p>
            {activities.length === 0 && (
              <div className="mt-4 flex justify-center gap-4">
                <Button onClick={() => navigate('/shipper/post-shipment')} className="bg-blue-600 hover:bg-blue-700">
                  Post a Shipment
                </Button>
                <Button onClick={() => navigate('/browse-trucks')} variant="outline">
                  Find Trucks
                </Button>
              </div>
            )}
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow border-blue-100">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${activity.type === 'shipment' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {activity.type === 'shipment' ? <Package className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{activity.title}</h3>
                          <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{activity.description}</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{activity.counterparty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{activity.weight}t load</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-700">₹{activity.amount.toLocaleString('en-IN')} /t</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center gap-2 min-w-[120px]">
                    <Button variant="outline" size="sm" onClick={() => navigate(activity.type === 'shipment' ? `/shipper/shipments/${activity.id}` : `/trips/${activity.id}`)}>
                      <Eye className="h-4 w-4 mr-2" /> Details
                    </Button>
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

export default ShipperHistory;