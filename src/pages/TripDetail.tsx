"use client";

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { MapPin, Calendar, Truck, IndianRupee, ArrowLeft, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import Star from '@/components/Star';
import RouteMap from '@/components/RouteMap';
import { sendNotification } from '@/utils/notifications';

const TripDetail = () => {
  const { tripId } = useParams();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTripAndReviews = async () => {
      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        
        const supabase = createClerkSupabaseClient(supabaseToken);
        
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*, trucker:users(*)')
          .eq('id', tripId)
          .single();
        
        if (tripError) throw tripError;
        
        // Handle potential array or object return for trucker
        const truckerInfo = Array.isArray(tripData.trucker) ? tripData.trucker[0] : tripData.trucker;
        
        setTrip({
          ...tripData,
          trucker: truckerInfo
        } as unknown as Trip);

        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*, shipper:users(full_name)')
          .eq('trucker_id', tripData.trucker_id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (reviewData) setReviews(reviewData);

      } catch (err: any) {
        showError(err.message || 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    };
    fetchTripAndReviews();
  }, [tripId, getToken]);

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
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabaseClient = createClerkSupabaseClient(supabaseToken);
      
      // 1. Insert the request
      const { data: requestData, error: insertError } = await supabaseClient
        .from('requests')
        .insert({
          trip_id: tripId,
          shipper_id: userProfile.id,
          goods_description: description.trim(),
          weight_tonnes: requestedWeight,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Send notification to trucker
      await sendNotification({
        userId: trip.trucker_id,
        message: `New Request: ${userProfile.full_name} wants to book ${requestedWeight}t for your ${trip.origin_city} to ${trip.destination_city} trip.`,
        relatedTripId: trip.id,
        getToken: () => getToken({ template: 'supabase' })
      });

      showSuccess('Booking request sent successfully!');
      navigate('/shipper/my-shipments?tab=sent');
    } catch (err: any) {
      console.error('[handleRequest] Error:', err);
      showError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading trip details...</div>;
  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <div className="mb-8">
        <RouteMap originCity={trip.origin_city} destinationCity={trip.destination_city} height="280px" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Trip Information</CardTitle>
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
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" /> Available Capacity              </div>
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
                      <Star filled className="h-3 w-3 text-yellow-500 mr-1" />
                      {trip.trucker?.rating?.toFixed(1) || '0.0'} Rating • {trip.trucker?.total_trips || 0} Trips
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {reviews.length > 0 && (
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                  Recent Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold">{review.shipper?.full_name}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} filled={review.rating >= s} className="h-3 w-3" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic">"{review.comment}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {userProfile?.user_type === 'shipper' && (
          <Card className="border-orange-200 shadow-md h-fit sticky top-24">
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
                    placeholder="e.g. 2.5"
                    className="pr-16"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
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

export default TripDetail;