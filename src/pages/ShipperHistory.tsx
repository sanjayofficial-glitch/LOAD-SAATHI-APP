"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectLabel, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Truck, Package, CheckCircle, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const ShipperHistory = () => {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    activityType: '',
    status: '',
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query the shipper_history view
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['shipperHistory', filters.activityType, filters.status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipper_history')
        .select('*')
        .eq('user_id', user?.id); // Ensures view filtering by JWT sub

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Filter activities based on current filters
  const filteredActivities = useCallback(() => {
    if (!activities) return [];
    
    return activities.filter(activity => {
      // Filter by activity type
      if (filters.activityType && activity.activity_type !== filters.activityType) return false;
      // Filter by status
      if (filters.status && activity.status !== filters.status) return false;
      return true;
    });
  }, [activities, filters]);

  const applyFilters = () => {
    // Trigger re-query with new filters
  };

  // Handle item click
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="text-orange-600 animate-spin">Loading history...</span>
    </div>
  );

  // Modal for full details
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with filters */}
      <div className="container mx-auto px-4 py-6 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Activity History</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="default" className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {user?.user_type === 'shipper' ? 'Shipper' : 'Unknown'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Activity Type Filter */}
          <div className="border rounded-lg p-3">
            <Label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type
            </Label>
            <SelectTrigger asChild>
              <Select>
                <SelectLabel value="">All Types</SelectLabel>
                <SelectValue asChild className="text-sm">
                  <ArrowLeft className="mr-1" />
                  All
                </SelectValue>
              </SelectTrigger>
              <SelectOverlay asChild className="absolute left-0 w-full">
                {[
                  { value: 'shipment', label: 'Shipment' },
                  { value: 'outgoing_request', label: 'Outgoing Request' },
                  { value: 'incoming_shipment_request', label: 'Incoming Shipment Request' },
                  { value: 'completed_trip', label: 'Completed Trip' },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectOverlay>
            </SelectTrigger>
          </div>

          {/* Status Filter */}
          <div className="border rounded-lg p-3">
            <Label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </Label>
            <SelectTrigger asChild>
              <Select>
                <SelectLabel value="">All Statuses</SelectLabel>
                <SelectValue asChild className="text-sm">
                  <ArrowLeft className="mr-1" />
                  All
                </SelectValue>
              </SelectTrigger>
              <SelectOverlay asChild className="absolute left-0 w-full">
                {[
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'completed', label: 'Completed' },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectOverlay>
            </SelectTrigger>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          {filteredActivities().length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No activity history found</p>
            </div>
          ) : (
            filteredActivities().map((activity) => (
              <Card 
                key={activity.id}                 className="border border-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleItemClick(activity)}
              >
                <CardContent className="p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200">
                        {renderActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 font-medium">
                          {activity.activity_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleDateString('en-IN', {                             day: 'numeric', 
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.counterparty_name || 'N/A'}
                      </span>
                      <Badge 
                        variant={getBadgeVariant(activity.status)} 
                        className="ml-2"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Card>
            ))}
          }
        </div>
      </div>
    </div>
  );
};

// Helper to render icon based on activity type
function renderActivityIcon(type: string) {
  switch (type) {
    case 'shipment':
      return <Package className="h-6 w-6 text-blue-600" />;
    case 'outgoing_request':
      return <ArrowRight className="h-6 w-6 text-orange-600" />;
    case 'incoming_shipment_request':
      return <MessageSquare className="h-6 w-6 text-blue-600" />;
    case 'completed_trip':
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    default:
      return <RefreshCw className="h-6 w-6 text-gray-500" />;
  }
}

// Helper to get badge variant based on status
function getBadgeVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'accepted':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'default';
  }
}

export default ShipperHistory;