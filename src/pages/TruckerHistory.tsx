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
import { 
  Truck, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Filter,
  Eye,
  Package,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

interface ActivityItem {
  id: string;
  activity_type: string;
  reference_id: string;
  activity_date: string;
  description: string;
  status: string;
  title: string;
  counterparty_name: string;
  trip_details?: string;
  shipment_details?: string;
}

const TruckerHistory = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [filters, setFilters] = useState({
    activityType: '',
    status: ''
  });

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["truckerHistory", filters.activityType, filters.status],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);

      const { data, error } = await supabase
        .from("trucker_history")
        .select("*")
        .eq("user_id", userProfile.id);

      if (error) throw error;
      return (data as ActivityItem[]) || [];
    },
    enabled: !!userProfile?.id
  });

  const filteredActivities = activities.filter(activity => {
    if (filters.activityType && activity.activity_type !== filters.activityType) return false;
    if (filters.status && activity.status !== filters.status) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'active':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      pending: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      active: { variant: 'default' as const, className: 'bg-blue-100 text-blue-800' },
      failed: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'trip':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'shipment':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'request':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      default:
        return <Eye className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const uniqueActivityTypes = [...new Set(activities.map(a => a.activity_type))].filter(Boolean);
  const uniqueStatuses = [...new Set(activities.map(a => a.status))].filter(Boolean);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <span className="text-orange-600 animate-spin">Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Activity History</h1>
        <p className="text-gray-600">View all your past trips, shipments, and activities</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <Select 
                value={filters.activityType || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, activityType: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All activity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All activity types</SelectItem>
                  {uniqueActivityTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => setFilters({ activityType: '', status: '' })} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
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
              {activities.filter(a => a.status === 'completed').length}
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
                const activityDate = new Date(a.activity_date);
                const now = new Date();
                return activityDate.getMonth() === now.getMonth() && 
                       activityDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-500">
                {activities.length === 0 
                  ? "You don't have any activity history yet." 
                  : "Try adjusting your filters to see more activities."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                          {getStatusIcon(activity.status)}
                          <span className="text-sm text-gray-500">{formatDate(activity.activity_date)}</span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{activity.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{activity.counterparty_name}</span>
                          </div>
                          
                          {activity.trip_details && (
                            <div className="flex items-center space-x-1">
                              <Truck className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{activity.trip_details}</span>
                            </div>
                          )}
                          
                          {activity.shipment_details && (
                            <div className="flex items-center space-x-1">
                              <Package className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{activity.shipment_details}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(activity.status)}
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Eye className="mr-1 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TruckerHistory;