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
import { MapPin, Calendar, Truck, IndianRupee, Phone, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const TripDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!trip) return;

    const requestedWeight = parseFloat(weight);
    if (isNaN(requestedWeight) || requestedWeight <= 0) {
      showError('Please enter a valid weight');
      return;
    }

    if (requestedWeight > trip.available_capacity_tonnes) {
      showError(`Requested weight exceeds available capacity (${trip.available_capacity_tonnes} tonnes)`);
      return;
    }

    if (!description.trim()) {
      showError('Please provide a description of your goods');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('requests').insert({
      trip_id: id,
      shipper_id: userProfile.id,
      goods_description: description.trim(),
      weight_tonnes: requestedWeight,
      status: 'pending'
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Booking request sent successfully!');
      navigate('/shipper/my-shipments');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center">Loading trip details...</div>;
  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle className="text-2xl">Trip Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center text-xl font-bold text-gray-900">
                <MapPin className="mr-2 text-orange-600" /> {trip.origin_city} → {trip.destination_city}
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="mr-2 h-4 w-4" /> 
                {new Date(trip.departure_date).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Vehicle</p>
                <div className="flex items-center font-medium">
                  <Truck className="mr-2 h-4 w-4 text-gray-400" /> {trip.vehicle_type}
                </div>
                <p className="text-xs text-gray-400 ml-6">{trip.vehicle_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Price</p>
                <div className="flex items-center font-bold text-orange-600 text-lg">
                  <IndianRupee className="mr-1 h-4 w-4" /> {trip.price_per_tonne.toLocaleString()}
                  <span className="text-xs text-gray-400 font-normal ml-1">/tonne</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center text-blue-700 font-semibold">
                <CheckCircle className="mr-2 h-5 w-5" /> Available Capacity
              </div>
              <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                {trip.available_capacity_tonnes} Tonnes
              </Badge>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-500 uppercase font-bold mb-3">Trucker Details</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg font-bold text-orange-600">
                    {trip.trucker?.full_name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{trip.trucker?.full_name}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-3 w-3 text-yellow-500 mr-1 fill-current" />
                    {trip.trucker?.rating?.toFixed(1) || '0.0'} Rating • {trip.trucker?.total_trips || 0} Trips
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {userProfile?.user_type === 'shipper' && (
          <Card className="border-orange-200 shadow-md">
            <CardHeader className="bg-orange-50/50">
              <CardTitle>Book Space</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight to Book (Tonnes)</Label>
                <div className="relative">
                  <Input 
                    id="weight"
                    type="number" 
                    step="0.1"
                    value={weight} 
                    onChange={(e) => setWeight(e.target.value)} 
                    placeholder="e.g. 2.5"
                    className="pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                    Tonnes
                  </div>
                </div>
                {parseFloat(weight) > trip.available_capacity_tonnes && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" /> Exceeds available capacity
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Goods Description</Label>
                <Input 
                  id="description"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="e.g. Cotton fabric, Electronics, etc." 
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estimated Cost:</span>
                  <span className="font-bold text-gray-900">
                    ₹{((parseFloat(weight) || 0) * trip.price_per_tonne).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  * Final price to be confirmed with the trucker.
                </p>
              </div>

              <Button 
                onClick={handleRequest} 
                className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-bold"
                disabled={submitting || !weight || parseFloat(weight) > trip.available_capacity_tonnes}
              >
                {submitting ? 'Sending Request...' : 'Send Booking Request'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Helper for Star icon
const Star = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default TripDetail;