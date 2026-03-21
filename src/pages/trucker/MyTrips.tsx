import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Calendar, IndianRupee, CheckCircle, XCircle, Clock, Eye, Phone } from 'lucide-react';

const MyTrips = () => {
  const { userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const fetchTrips = async () => {
      const { data } = await supabase.from('trips').select('*').eq('trucker_id', userProfile?.id);
      if (data) setTrips(data as Trip[]);
    };
    fetchTrips();
  }, [userProfile]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Trips</h1>
      <div className="grid gap-4">
        {trips.map(trip => (
          <Card key={trip.id}>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{trip.origin_city} → {trip.destination_city}</h3>
                <p className="text-gray-500">{new Date(trip.departure_date).toLocaleDateString()}</p>
              </div>
              <Badge>{trip.status}</Badge>
              <Link to={`/trips/${trip.id}`}>
                <Eye className="h-5 w-5 text-gray-400 hover:text-orange-600" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyTrips;