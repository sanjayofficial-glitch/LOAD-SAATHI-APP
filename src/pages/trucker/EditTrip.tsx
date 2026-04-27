"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Truck, Check as CheckIcon, Calendar, IndianRupee } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import LocationSelector from '@/components/LocationSelector';
import locationData from '@/data/locations.json';

const EditTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Location state
  const [origin, setOrigin] = useState({ state: '', district: '', city: '' });
  const [destination, setDestination] = useState({ state: '', district: '', city: '' });
  
  const [formData, setFormData] = useState({
    departure_date: '',
    available_capacity_tonnes: '',
    price_per_tonne: '',
    vehicle_type: '',
    vehicle_number: ''
  });

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId || !userProfile?.id) return;
      
      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        
        const supabase = createClerkSupabaseClient(supabaseToken);

        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (error || !data) {
          showError('Failed to load trip details');
          navigate('/trucker/my-trips');
          return;
        }

        if (data.trucker_id !== userProfile.id) {
          showError('You do not have permission to edit this trip');
          navigate('/trucker/my-trips');
          return;
        }
        
        // Set location data
        setOrigin({
          state: data.origin_state || '',
          district: '', // We don't store district, but the city should be enough
          city: data.origin_city || ''
        });
        
        setDestination({
          state: data.destination_state || '',
          district: '',
          city: data.destination_city || ''
        });
        
        setFormData({
          departure_date: data.departure_date || '',
          available_capacity_tonnes: data.available_capacity_tonnes?.toString() || '',
          price_per_tonne: data.price_per_tonne?.toString() || '',
          vehicle_type: data.vehicle_type || '',
          vehicle_number: data.vehicle_number || ''
        });
        
      } catch (err: any) {
        console.error('[EditTrip] Error:', err);
        showError('Failed to load trip details');
        navigate('/trucker/my-trips');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile && tripId) fetchTrip();
  }, [tripId, userProfile, getToken, navigate]);

  const handleOriginChange = (value: { state: string; district: string; city: string }) => {
    setOrigin(value);
  };

  const handleDestinationChange = (value: { state: string; district: string; city: string }) => {
    setDestination(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      showError('You must be logged in to edit a trip.');
      return;
    }

    if (!origin.city || !destination.city) {
      showError('Please select origin and destination locations');
      return;
    }

    const capacity = parseFloat(formData.available_capacity_tonnes);
    const price = parseFloat(formData.price_per_tonne);

    if (isNaN(capacity) || capacity <= 0) {
      showError('Please enter a valid capacity.');
      return;
    }

    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price.');
      return;
    }

    setSaving(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('trips')
        .update({
          origin_city: origin.city,
          origin_state: origin.state,
          destination_city: destination.city,
          destination_state: destination.state,
          departure_date: formData.departure_date,
          available_capacity_tonnes: capacity,
          price_per_tonne: price,
          vehicle_type: formData.vehicle_type.trim(),
          vehicle_number: formData.vehicle_number.trim(),
        })
        .eq('id', tripId);

      if (error) throw error;

      showSuccess('Trip updated successfully!');
      navigate('/trucker/my-trips');
    } catch (err: any) {
      console.error('[EditTrip] Error:', err);
      showError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Trips
      </Button>

      <Card className="border-orange-100 shadow-lg">
        <CardHeader className="bg-orange-50/50 border-b border-orange-100">
          <CardTitle className="flex items-center text-orange-900">
            <Truck className="mr-2 text-orange-600" />
            Edit Trip Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Origin Location</Label>
              <LocationSelector
                label="Origin"
                data={locationData.data}
                value={origin}
                onChange={handleOriginChange}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Destination Location</Label>
              <LocationSelector
                label="Destination"
                data={locationData.data}
                value={destination}
                onChange={handleDestinationChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Departure Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="date"
                    type="date" 
                    className="pl-10"
                    value={formData.departure_date} 
                    onChange={(e) => setFormData({...formData, departure_date: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Available Capacity (Tonnes)</Label>
                <Input 
                  id="capacity"
                  type="number" 
                  step="0.1" 
                  placeholder="e.g. 5.0"
                  value={formData.available_capacity_tonnes} 
                  onChange={(e) => setFormData({...formData, available_capacity_tonnes: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Tonne (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="price"
                  type="number" 
                  placeholder="e.g. 1500"
                  className="pl-10"
                  value={formData.price_per_tonne} 
                  onChange={(e) => setFormData({...formData, price_per_tonne: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Input 
                  id="vehicleType"
                  placeholder="e.g. 12 Wheeler"
                  value={formData.vehicle_type} 
                  onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input 
                  id="vehicleNumber"
                  placeholder="e.g. RJ 14 GB 1234"
                  value={formData.vehicle_number} 
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-bold" 
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><CheckIcon className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTrip;