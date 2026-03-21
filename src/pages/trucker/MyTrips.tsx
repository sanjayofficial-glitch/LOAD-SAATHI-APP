import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, Calendar, Eye, CheckCircle2, MapPin, IndianRupee } from 'lucide-react';

const MyTrips = () => {
  const { userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('trucker_id', userProfile?.id)
      .order('created_at', { ascending: false });
    
    if (data) setTrips(data as Trip[]);
    setLoading(false);
  };

  useEffect(() => {
    if (userProfile) fetchTrips();
  }, [userProfile]);

  const handleCompleteTrip = async (tripId: string) => {
    const { error } = await supabase
      .from('trips')
      .update({ status: 'completed' })
      .eq('id', tripId);

    if (error) {
      showError('Failed to complete trip');
    } else {
      showSuccess('Trip marked as completed!');
      fetchTrips();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500">Manage your posted routes and bookings</p>
        </div>
        <Link to="/trucker/post-trip">
          <Button className="bg-orange-600 hover:bg-orange-700 shadow-md">
            Post New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No trips posted yet</h3>
          <p className="text-gray-500 mb-6">Start earning by sharing your empty truck space</p>
          <Link to="/trucker/post-trip">
            <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
              Post Your First Trip
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {trips.map(trip => (
            <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-xl font-bold text-gray-900">
                        {trip.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {trip.destination_city}
                      </div>
                      <Badge variant={trip.status === 'active' ? 'default' : 'secondary'} className={
                        trip.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600'
                      }>
                        {trip.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                        {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-blue-600" />
                        {trip.vehicle_type}
                      </div>
                      <div className="flex items-center font-semibold text-gray-900">
                        <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                        {trip.price_per_tonne.toLocaleString()} /t
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                    <Link to={`/trips/${trip.id}`} className="flex-1 sm:flex-none">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                    {trip.status === 'active' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                        onClick={() => handleCompleteTrip(trip.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}
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

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default MyTrips;