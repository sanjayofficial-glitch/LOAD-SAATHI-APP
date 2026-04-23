"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Trip } from '@/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Truck, 
  Calendar, 
  MapPin, 
  IndianRupee, 
  ArrowRight, 
  Search, 
  Filter,
  Loader2,
  Package
} from 'lucide-react';
import { showError } from '@/utils/toast';

const TripList = () => {
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minCapacity: ''
  });

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;
      
      const supabase = createClerkSupabaseClient(token);
      
      let query = supabase
        .from('trips')
        .select('*, trucker:users(*)')
        .eq('status', 'active')
        .order('departure_date', { ascending: true });

      if (filters.origin) {
        query = query.ilike('origin_city', `%${filters.origin}%`);
      }
      if (filters.destination) {
        query = query.ilike('destination_city', `%${filters.destination}%`);
      }
      if (filters.minCapacity) {
        query = query.gte('available_capacity_tonnes', parseFloat(filters.minCapacity));
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrips(data || []);
    } catch (err: any) {
      console.error('[TripList] Error:', err);
      showError('Failed to load available trucks');
    } finally {
      setLoading(false);
    }
  }, [getToken, filters]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card className="border-orange-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-600" />
            Filter Available Trucks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="origin"
                  placeholder="e.g. Mumbai" 
                  className="pl-10"
                  value={filters.origin}
                  onChange={(e) => setFilters(f => ({ ...f, origin: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="destination"
                  placeholder="e.g. Delhi" 
                  className="pl-10"
                  value={filters.destination}
                  onChange={(e) => setFilters(f => ({ ...f, destination: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Min Capacity (Tonnes)</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="capacity"
                  type="number"
                  placeholder="e.g. 5" 
                  className="pl-10"
                  value={filters.minCapacity}
                  onChange={(e) => setFilters(f => ({ ...f, minCapacity: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
          <p className="text-gray-500">Finding the best trucks for you...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No trucks found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-all group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-xl font-bold text-gray-900">
                          {trip.origin_city} 
                          <ArrowRight className="h-5 w-5 mx-3 text-gray-400" /> 
                          {trip.destination_city}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                          {new Date(trip.departure_date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        {trip.vehicle_type}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Capacity</p>
                        <p className="font-bold text-gray-900">{trip.available_capacity_tonnes} Tonnes</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Price</p>
                        <p className="font-bold text-green-600 flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {trip.price_per_tonne.toLocaleString()} /t
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg hidden sm:block">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Trucker</p>
                        <p className="font-medium text-gray-900 truncate">
                          {trip.trucker?.full_name || 'Verified Trucker'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-48 bg-orange-50/50 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-orange-100">
                    <Button 
                      onClick={() => navigate(`/trips/${trip.id}`)}
                      className="w-full bg-orange-600 hover:bg-orange-700 shadow-sm group-hover:shadow-md transition-all"
                    >
                      View & Book
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;