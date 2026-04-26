import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Filter,
  Truck,
  MapPin,
  Package as PackageIcon,
  AlertCircle,
  Plus
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';

const TripList = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minCapacity: '',
    maxPrice: ''
  });

  // Fetch trips with proper error handling
  const fetchTrips = useCallback(async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        showError('Authentication required');
        return;
      }

      const supabaseClient = createClerkSupabaseClient(token);

      // Build query with proper filtering
      let query = supabaseClient
        .from('trips')
        .select(`
          *, 
          trucker:users!trips_trucker_id_fkey(
            full_name,
            rating,
            total_trips
          )
        `)
        .eq('status', 'active')
        .order('departure_date', { ascending: true });

      // Apply filters
      if (filters.origin) {
        query = query.ilike('origin_city', `%${filters.origin}%`);
      }
      if (filters.destination) {
        query = query.ilike('destination_city', `%${filters.destination}%`);
      }
      if (filters.minCapacity) {
        query = query.gte('available_capacity_tonnes', parseFloat(filters.minCapacity));
      }
      if (filters.maxPrice) {
        query = query.lte('price_per_tonne', parseFloat(filters.maxPrice));
      }
      if (searchTerm) {
        query = query.or(`origin_city.ilike.%${searchTerm}%,destination_city.ilike.%${searchTerm}%,trucker.full_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Trips fetch error:', error);
        showError('Failed to load available trucks');
        return;
      }

      setTrips(data || []);
    } catch (err: any) {
      console.error('Trips error:', err);
      showError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [getToken, filters, searchTerm, userProfile?.id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchesSearch = !searchTerm || 
        t.origin_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.destination_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.trucker?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOrigin = !filters.origin || t.origin_city.toLowerCase().includes(filters.origin.toLowerCase());
      const matchesDest = !filters.destination || t.destination_city.toLowerCase().includes(filters.destination.toLowerCase());
      const matchesCapacity = !filters.minCapacity || t.available_capacity_tonnes >= parseFloat(filters.minCapacity);
      const matchesPrice = !filters.maxPrice || t.price_per_tonne <= parseFloat(filters.maxPrice);

      return matchesSearch && matchesOrigin && matchesDest && matchesCapacity && matchesPrice;
    });
  }, [trips, searchTerm, filters]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-orange-600 mb-4" />
        <p className="text-lg font-medium text-gray-900">Please log in to browse trucks</p>
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
      {/* Search and Filters */}
      <Card className="border-orange-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by city, trucker name..."
                className="pl-10 border-orange-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({ origin: '', destination: '', minCapacity: '', maxPrice: '' });
                  setSearchTerm('');
                }}
                className="border-gray-200"
              >
                Clear
              </Button>
              <Button 
                variant="outline" 
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={fetchTrips}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4 mr-2" />}
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Filter inputs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Origin</Label>
              <Input
                placeholder="e.g. Mumbai"
                value={filters.origin}
                onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
                className="border-orange-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Destination</Label>
              <Input
                placeholder="e.g. Delhi"
                value={filters.destination}
                onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                className="border-orange-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Min Capacity</Label>
              <Input
                type="number"
                placeholder="e.g. 5"
                value={filters.minCapacity}
                onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                className="border-orange-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase">Max Price</Label>
              <Input
                type="number"
                placeholder="e.g. 2000"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="border-orange-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-4">
        {filteredTrips.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="py-20 text-center">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trucks found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
              <div className="flex gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ origin: '', destination: '', minCapacity: '', maxPrice: '' })}
                  className="border-gray-200"
                >
                  Clear All Filters
                </Button>
                <Link to="/trucker/post-trip">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your Own Trip
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTrips.map((trip) => (
              <Card 
                key={trip.id} 
                className="border-orange-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center text-xl font-bold text-gray-900">
                          <MapPin className="h-5 w-5 text-orange-600 mr-2" />
                          {trip.origin_city}
                          <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                          {trip.destination_city}
                        </div>
                        <Badge 
                          variant={trip.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs font-semibold"
                        >
                          {trip.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                          <span>{new Date(trip.departure_date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center">
                          <PackageIcon className="h-4 w-4 mr-2 text-purple-600" />
                          <span>{trip.available_capacity_tonnes}t</span>
                        </div>
                        <div className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                          <span className="font-semibold">₹{trip.price_per_tonne.toLocaleString()} /t</span>
                        </div>
                        <div className="flex items-center md:col-span-3">
                          <Truck className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {trip.trucker?.full_name || 'Verified Trucker'}
                          </span>
                        </div>
                        <div className="flex items-center md:col-span-3">
                          <span className="text-xs text-gray-500">
                            {trip.trucker?.rating ? `⭐ ${trip.trucker.rating.toFixed(1)} Rating` : 'No ratings yet'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-48 flex flex-col gap-2">
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/trips/${trip.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripList;