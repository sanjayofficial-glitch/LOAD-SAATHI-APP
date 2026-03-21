import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { MapPin, Calendar, Truck, IndianRupee, Phone, ArrowLeft, CheckCircle } from 'lucide-react';

const TripDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchTrip = async () => {
      const { data } = await supabase.from('trips').select('*, trucker:users(*)').eq('id', id).single();
      if (data) setTrip(data as Trip);
      setLoading(false);
    };
    fetchTrip();
  }, [id]);

  const handleRequest = async () => {
    if (!userProfile) return navigate('/login');
    const { error } = await supabase.from('requests').insert({
      trip_id: id,
      shipper_id: userProfile.id,
      goods_description: description,
      weight_tonnes: parseFloat(weight),
      status: 'pending'
    });
    if (error) showError(error.message);
    else {
      showSuccess('Request sent!');
      navigate('/shipper/my-shipments');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Trip Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-lg font-semibold">
              <MapPin className="mr-2 text-orange-600" /> {trip.origin_city} → {trip.destination_city}
            </div>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-500" /> {new Date(trip.departure_date).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Truck className="mr-2 h-4 w-4 text-gray-500" /> {trip.vehicle_type} ({trip.vehicle_number})
            </div>
            <div className="flex items-center text-xl font-bold text-orange-600">
              <IndianRupee className="mr-1 h-5 w-5" /> {trip.price_per_tonne}/tonne
            </div>
            <Badge variant="outline" className="bg-blue-50">Available: {trip.available_capacity_tonnes} tonnes</Badge>
          </CardContent>
        </Card>

        {userProfile?.user_type === 'shipper' && (
          <Card>
            <CardHeader>
              <CardTitle>Book Space</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Weight (Tonnes)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 2.5" />
              </div>
              <div className="space-y-2">
                <Label>Goods Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cotton fabric" />
              </div>
              <Button onClick={handleRequest} className="w-full bg-orange-600 hover:bg-orange-700">Send Request</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TripDetail;