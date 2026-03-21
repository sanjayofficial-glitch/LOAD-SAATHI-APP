import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, Calendar, Eye, CheckCircle2 } from 'lucide-react';

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
        <Link to="/trucker/post-trip">
          <Button className="bg-orange-600 hover:bg-orange-700">Post New Trip</Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">You haven't posted any trips yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map(trip => (
            <Card key={trip.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {trip.origin_city} → {trip.destination_city}
                      </h3>
                      <Badge variant={trip.status === 'active' ? 'default' : 'secondary'} className={
                        trip.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
                      }>
                        {trip.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(trip.departure_date).toLocaleDateString()}
                      </span>
                      <span>{trip.vehicle_type} • {trip.vehicle_number}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link to={`/trips/${trip.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                    {trip.status === 'active' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleCompleteTrip(trip.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Completed
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

export default MyTrips;