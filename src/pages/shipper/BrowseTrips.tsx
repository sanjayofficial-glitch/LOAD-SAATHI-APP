import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { parseNaturalLanguageSearch } from '@/lib/gemini';
import { showSuccess, showError } from '@/utils/toast';
import { 
  Search, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Truck,
  Filter,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';

const BrowseTrips = () => {
  const { userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minCapacity: '',
    maxPrice: '',
    date: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const INDIAN_CITIES = [
    'Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur'
  ];

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('trips')
      .select(`
        *,
        trucker:users(*)
      `)
      .eq('status', 'active')
      .order('departure_date', { ascending: true });

    if (data) {
      setTrips(data as Trip[]);
      setFilteredTrips(data as Trip[]);
    }
    setLoading(false);
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    const parsedFilters = await parseNaturalLanguageSearch(aiQuery);
    
    if (Object.keys(parsedFilters).length > 0) {
      setFilters({
        origin: parsedFilters.origin || '',
        destination: parsedFilters.destination || '',
        minCapacity: parsedFilters.weight?.toString() || '',
        maxPrice: '',
        date: parsedFilters.date || ''
      });
      setShowFilters(true);
      showSuccess('AI parsed your search filters!');
    } else {
      showError('AI could not understand the search. Try being more specific.');
    }
    setAiLoading(false);
  };

  useEffect(() => {
    let result = trips;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(trip => 
        trip.origin_city.toLowerCase().includes(query) ||
        trip.destination_city.toLowerCase().includes(query) ||
        trip.vehicle_type.toLowerCase().includes(query) ||
        trip.trucker?.full_name.toLowerCase().includes(query)
      );
    }

    if (filters.origin) {
      result = result.filter(trip => trip.origin_city.toLowerCase() === filters.origin.toLowerCase());
    }
    if (filters.destination) {
      result = result.filter(trip => trip.destination_city.toLowerCase() === filters.destination.toLowerCase());
    }
    if (filters.minCapacity) {
      result = result.filter(trip => trip.available_capacity_tonnes >= parseFloat(filters.minCapacity));
    }
    if (filters.maxPrice) {
      result = result.filter(trip => trip.price_per_tonne <= parseFloat(filters.maxPrice));
    }
    if (filters.date) {
      result = result.filter(trip => trip.departure_date === filters.date);
    }

    setFilteredTrips(result);
  }, [trips, searchQuery, filters]);

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      minCapacity: '',
      maxPrice: '',
      date: ''
    });
    setSearchQuery('');
    setAiQuery('');
  };

  const hasActiveFilters = searchQuery || aiQuery || Object.values(filters).some(v => v !== '');

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Available Trucks</h1>
          <p className="text-gray-600 mt-2">Browse trips posted by truckers across India</p>
        </div>

        {/* AI Smart Search */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg mb-8 text-white">
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-semibold">AI Smart Search</h2>
          </div>
          <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder='Try: "I want to send 2 tonnes from Jaipur to Delhi next week"'
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 h-12"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-white text-orange-600 hover:bg-orange-50 h-12 px-8 font-bold"
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search with AI'}
            </Button>
          </form>
          <p className="text-xs text-white/70 mt-3">
            Describe your shipment in plain words and our AI will fill the filters for you.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by city, vehicle type, or trucker name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(v => v !== '').length + (searchQuery ? 1 : 0)}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} size="sm">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium mb-1 block">Origin</Label>
                <select
                  value={filters.origin}
                  onChange={(e) => setFilters({...filters, origin: e.target.value})}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Any</option>
                  {INDIAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Destination</Label>
                <select
                  value={filters.destination}
                  onChange={(e) => setFilters({...filters, destination: e.target.value})}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">Any</option>
                  {INDIAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Min Capacity (tonnes)</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={filters.minCapacity}
                  onChange={(e) => setFilters({...filters, minCapacity: e.target.value})}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Max Price (₹/tonne)</Label>
                <Input
                  type="number"
                  min="100"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  placeholder="e.g., 3000"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Departure Date</Label>
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available trips...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center text-lg font-bold text-gray-900">
                        <MapPin className="h-4 w-4 text-orange-600 mr-1" />
                        {trip.origin_city}
                      </div>
                      <div className="flex items-center text-lg font-bold text-gray-900">
                        <MapPin className="h-4 w-4 text-red-600 mr-1" />
                        {trip.destination_city}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(trip.departure_date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="h-4 w-4 mr-2" />
                      {trip.vehicle_type} • {trip.vehicle_number}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <IndianRupee className="h-4 w-4 mr-2" />
                      <span className="font-semibold text-lg text-orange-600">
                        ₹{trip.price_per_tonne.toLocaleString()}
                      </span>
                      <span className="text-gray-500">/tonne</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium">Available:</span>
                      <span className="ml-2 font-bold text-blue-600">{trip.available_capacity_tonnes} tonnes</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold">
                          {trip.trucker?.full_name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{trip.trucker?.full_name}</p>
                        <p className="text-xs text-gray-500">
                          Rating: {trip.trucker?.rating?.toFixed(1) || '0.0'} ★
                        </p>
                      </div>
                    </div>
                    <Link to={`/trips/${trip.id}`}>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        View Details & Request
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseTrips;