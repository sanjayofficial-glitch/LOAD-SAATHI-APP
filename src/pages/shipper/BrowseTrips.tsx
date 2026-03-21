import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Truck,
  Filter,
  X,
  Sparkles,
  Loader2,
  ArrowRight as ArrowRightIcon
} from 'lucide-react';
import { parseNaturalLanguageSearch } from '@/lib/gemini'; // Add import
import { showSuccess, showError } from '@/utils/toast'; // Add import

const INDIAN_CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Pune', 'Surat', 'Kanpur',
  'Jaipur', 'Lucknow', 'Nagpur', 'Coimbatore', 'Gurgaon', 'Visakhapatnam', 'Indore', 'Thane', 'Noida', 'Ghaziabad',
  'Jammu', 'Gwalior', 'Chandigarh', 'Mysore', 'Amritsar', 'Gurgaon', 'Vadodara', 'Patna', 'Jabalpur', 'Ghaziabad',
  'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kochi', 'Jalandhar', 'Moradabad', 'Mysore',
  'Tiruchirappalli', 'Solapur', 'Jamshedpur', 'Kalyan-Dombivli', 'Bhilai', 'Ranchi', 'Amravati', 'Durgapur', 'Nashik', 'Jammu'
];

const BrowseTrips = () => {
  const { userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (!userProfile) return;

    const { data } = await supabase
      .from('trips')
      .select(`*`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) {
      setTrips(data as Trip[]);
      setFilteredTrips(data as Trip[]);
    }
    setLoading(false);
  }, [userProfile]);

  useEffect(() => {
    fetchTrips();

    const channel = supabase
      .channel('public:trips')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trips' 
      }, () => {
        fetchTrips();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrips]);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    const parsedFilters = await parseNaturalLanguageSearch(aiQuery); // Now works
    
    if (Object.keys(parsedFilters).length > 0) {
      setFilters({
        origin: parsedFilters.origin || '',
        destination: parsedFilters.destination || '',
        minCapacity: parsedFilters.weight?.toString() || '',
        maxPrice: '',
        date: parsedFilters.date || ''
      });
      setShowFilters(true);
      showSuccess('AI parsed your search filters!'); // Now works
    } else {
      showError('AI could not understand the search. Try being more specific.'); // Now works
    }
    setAiLoading(false);
  };

  // ... rest of the component remains the same
};

export default BrowseTrips;