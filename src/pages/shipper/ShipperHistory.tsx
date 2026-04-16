"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Clock, TrendingUp, DollarSign, Calendar, Package, CheckCircle, AlertCircle, Eye, Truck, Send } from 'lucide-react';
import { showError } from '@/utils/toast';

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_trip_id?: string;
  related_shipment_request_id?: string;
}

const ShipperHistory = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [filters, setFilters] = useState({ type: '', read: '' });

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['shipperHistory', filters.type, filters.read],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NotificationItem[];
    },
    enabled: !!userProfile?.id,
  });

  const filtered = notifications.filter((n) => {
    if (filters.type && n.type !== filters.type) return false;
    if (filters.read) {
      const wantRead = filters.read === 'read';
      if (wantRead !== n.is_read) return false;
    }
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'REQUEST':
        return <Send className="h-5 w-5 text-orange-600" />;
      case 'ACCEPT':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECT':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Eye className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <span className="text-orange-600 animate-spin">Loading history...</span>
        </div>
      </div>
    );
  }

  const uniqueTypes = Array.from(new Set(notifications.map((n) => n.type)));
  const uniqueRead = ['read', 'unread'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Activity History</h1>
        <p className="text-gray-600">View all your past notifications and actions</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(v) => setFilters((p) => ({ ...p, type: v === 'all' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {uniqueTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Read Status</label>
              <Select
                value={filters.read || 'all'}
                onValueChange={(v) => setFilters((p) => ({ ...p, read: v === 'all' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueRead.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => setFilters({ type: '', read: '' })} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter((n) => !n.is_read).length}
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
              {notifications.filter((n) => {
                const d = new Date(n.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter((n) => n.type === 'ACCEPT').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">Adjust filters or wait for new activity.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((n) => (
                <div key={n.id} className="border rounded-lg p-4 hover:shadow-md flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-100 p-2 rounded-full">{getIcon(n.type)}</div>
                    <div>
                      <p className="font-medium text-gray-900">{n.message}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                  <Badge variant={n.is_read ? 'secondary' : 'default'} className={n.is_read ? 'bg-gray-200 text-gray-800' : 'bg-orange-600 text-white'}>
                    {n.is_read ? 'Read' : 'New'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipperHistory;
