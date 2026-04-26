"use client";

import { useState, useMemo } from 'react';
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
  relatedId: string;
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
      if (!userProfile?.id) return [];
      
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('Authentication required');
      
      const supabase = createClerkSupabaseClient(supabaseToken);

      // Fetch shipments (loads posted by the shipper)
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('*')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (shipmentsError) console.error('[History] Shipments error:', shipmentsError);

      // Fetch requests (booking requests sent to truckers)
      // We use 'trips' for the join as it's the standard table name
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select(`
          id,
          created_at,
          status,
          weight_tonnes,
          goods_description,
          trip_id,
          trips!requests_trip_id_fkey(
            id,
            origin_city,
            destination_city,
            price_per_tonne
          )
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (requestsError) console.error('[History] Requests error:', requestsError);

      const items: ActivityItem[] = [];

      // Process shipments
      if (shipmentsData) {
        shipmentsData.forEach((s: any) => {
          items.push({
            id: `ship-${s.id}`,
            relatedId: s.id,
            type: 'shipment',
            date: s.created_at || new Date().toISOString(),
            title: `${s.origin_city || 'Unknown'} → ${s.destination_city || 'Unknown'}`,
            description: s.goods_description || 'No description',
            status: s.status || 'pending',
            counterparty: 'Load Saathi Truckers',
            amount: Number(s.budget_per_tonne) || 0,
            weight: Number(s.weight_tonnes) || 0
          });
        });
      }

      // Process requests
      if (requestsData) {
        requestsData.forEach((r: any) => {
          const trip = r.trips;
          items.push({
            id: `req-${r.id}`,
            relatedId: r.trip_id || '',
            type: 'request',
            date: r.created_at || new Date().toISOString(),
            title: `Booking: ${trip?.origin_city || 'Unknown'} → ${trip?.destination_city || 'Unknown'}`,
            description: r.goods_description || 'No description',
            status: r.status || 'pending',
            counterparty: 'Verified Trucker',
            amount: Number(trip?.price_per_tonne) || 0,
            weight: Number(r.weight_tonnes) || 0
          });
        });
      }

      // Sort by date descending
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!userProfile?.id,
  });

  const filteredActivities = useMemo(() => {
    if (!Array.isArray(activities)) return [];
    return activities.filter(activity => {
      if (filters.type !== 'all' && activity.type !== filters.type) return false;
      if (filters.status !== 'all' && activity.status !== filters.status) return false;
      return true;
    });
  }, [activities, filters]);

  const stats = useMemo(() => {
    const list = Array.isArray(activities) ? activities : [];
    const now = new Date();
    return {
      total: list.length,
      completed: list.filter(a => ['completed', 'accepted', 'matched'].includes(a.status.toLowerCase())).length,
      pending: list.filter(a => a.status.toLowerCase() === 'pending').length,
      thisMonth: list.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length
    };
  }, [activities]);

  const getStatusBadge = (status: string = 'pending') => {
    const s = status.toLowerCase();
    const config: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      matched: 'bg-blue-100 text-blue-800 border-blue-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return (
      <Badge variant="outline" className={`${config[s] || config.pending} font-semibold`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 text-orange-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Loading your activity history...</p>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-12">
      <Card className="border-red-100 bg-red-50/30">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to load history</h3>
          <p className="text-gray-600 mb-6">We encountered an error while fetching your activities.</p>
          <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700">Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">History & Activity</h1>
        <p className="text-gray-500 mt-1">Review all your past loads and bookings in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', val: stats.total, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', val: stats.completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', val: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'This Month', val: stats.thisMonth, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <Card key={i} className="border-gray-100">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8 border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Activity Type</label>
              <Select value={filters.type} onValueChange={(v) => setFilters(f => ({...f, type: v}))}>
                <SelectTrigger className="bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="shipment">Posted Loads</SelectItem>
                  <SelectItem value="request">Booking Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Status</label>
              <Select value={filters.status} onValueChange={(v) => setFilters(f => ({...f, status: v}))}>
                <SelectTrigger className="bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
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
              <Button variant="ghost" onClick={() => setFilters({type: 'all', status: 'all'})} className="text-gray-400 hover:text-gray-900">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No activities found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              {activities.length === 0 
                ? "Start posting loads or booking trucks to build your history." 
                : "No results match your current filters."}
            </p>
            {activities.length === 0 && (
              <div className="mt-8 flex justify-center gap-4">
                <Button onClick={() => navigate('/shipper/post-shipment')} className="bg-orange-600 hover:bg-orange-700">Post a Shipment</Button>
                <Button onClick={() => navigate('/browse-trucks')} variant="outline">Find Trucks</Button>
              </div>
            )}
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-xl transition-all duration-300 border-gray-100 overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={`w-2 md:w-1.5 ${activity.type === 'shipment' ? 'bg-blue-600' : 'bg-orange-600'}`} />
                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${activity.type === 'shipment' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {activity.type === 'shipment' ? <Package className="h-6 w-6" /> : <Send className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-gray-900 leading-none">{activity.title}</h3>
                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-tighter">#{activity.id.split('-')[1].slice(0, 6)}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">{getStatusBadge(activity.status)}</div>
                    </div>
                    
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 mb-6">
                      <p className="text-sm text-gray-600 font-medium">{activity.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity</p>
                        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-red-400" /> {activity.counterparty}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight</p>
                        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Package className="h-3 w-3 text-blue-400" /> {activity.weight}t
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate</p>
                        <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" /> {activity.amount.toLocaleString('en-IN')} /t
                        </p>
                      </div>
                      <div className="flex items-end sm:justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(activity.type === 'shipment' ? `/shipper/shipments/${activity.relatedId}` : `/trips/${activity.relatedId}`)}
                          className="text-orange-600 font-black text-xs hover:bg-orange-50 group-hover:translate-x-1 transition-transform"
                        >
                          DETAILS <Eye className="h-3.5 w-3.5 ml-2" />
                        </Button>
                      </div>
                    </div>
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