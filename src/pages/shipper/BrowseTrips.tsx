"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Calendar, 
  Package, 
  ArrowRight, 
  Loader2, 
  IndianRupee, 
  Sparkles, 
  Truck, 
  User,
  MapPin,
  Star
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { parseNaturalLanguageSearch } from '@/lib/gemini';

const BrowseTrips = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;
      const supabaseClient = createClerkSupabaseClient(token);
      
      // Fetch all active trips and join with the users table to get trucker details
      const { data, error } = await supabaseClient
        .from('trips')
        .select('*, trucker:users!trips_trucker_id_fkey(*)')
        .eq('status', 'active')
        .order('departure_date', { ascending: true });
        
      if (error) throw error;
      if (data) setTrips(data);
    } catch (err: any) {
      console.error('[BrowseTrips] Error:', err);
      showError('Failed to load available trucks');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const search = searchTerm.toLowerCase();
      return t.origin_city.toLowerCase().includes(search) || 
             t.destination_city.toLowerCase().includes(search) ||
             t.vehicle_type.toLowerCase().includes(search);
    });
  }, [trips, searchTerm]);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setAiLoading(true);
    try {
      const result = await parseNaturalLanguageSearch(aiSearchQuery);
      if (result.origin) setSearchTerm(result.origin);
      showSuccess('AI parsed your search!');
    } catch (err) {
      showError('AI search failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Available Trucks</h1>
        <p className="text-gray-600 mt-2">Browse trucks posted by truckers and book space for your goods</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-orange-100 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <Label className="text-sm font-semibold text-gray-700">AI Search</Label>
              <form onSubmit={handleAiSearch} className="space-y-3">
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                  <Input 
                    placeholder="e.g. 'Truck from Mumbai'" 
                    className="pl-10 border-orange-100"
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-600" disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AI Search
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by city or vehicle type..." 
              className="pl-10 py-6 rounded-xl border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No trucks found</h3>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-100 p-3 rounded-full">
                              <Truck className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {trip.origin_city} <ArrowRight className="h-4 w-4 inline mx-1 text-gray-400" /> {trip.destination_city}
                              </h3>
                              <p className="text-sm text-gray-600">{trip.vehicle_type} • {trip.vehicle_number}</p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">
                            {trip.available_capacity_tonnes}t Available
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Departure</p>
                              <p className="font-medium">{new Date(trip.departure_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Price</p>
                              <p className="font-bold text-green-600">₹{trip.price_per_tonne.toLocaleString()} /t</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Trucker</p>
                              <p className="font-medium">{trip.trucker?.full_name || 'Verified Trucker'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-48 bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center gap-2">
                        <Link to={`/trips/${trip.id}`}>
                          <Button className="w-full bg-orange-600">View & Book</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseTrips;