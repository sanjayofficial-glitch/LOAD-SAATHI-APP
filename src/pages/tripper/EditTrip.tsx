"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Truck, Check as CheckIcon } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useTripStatus } from '@/hooks/useTripStatus';

const EditTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    origin_city: '',
    destination_city: '',
    departure_date: '',
    available_capacity_tonnes: '',
    price_per_tonne: '',
    vehicle_type: '',
    vehicle_number: ''
  });
  const { tripStatus, setTripStatus } = useTripStatus('pending');

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (error) {
          showError('Failed to load trip details');
          navigate('/trucker/my-trips');
          return;
        }

        if (data) {
          if (data.trucker_id !== userProfile?.id) {
            showError('You do not have permission to edit this trip');
            navigate('/trucker/my-trips');
            return;
          }
          
          setFormData({
            origin_city: data.origin_city,
            destination_city: data.destination_city,
            departure_date: data.departure_date,
            available_capacity_tonnes: data.available_capacity_tonnes.toString(),
            price_per_tonne: data.price_per_tonne.toString(),
            vehicle_type: data.vehicle_type,
            vehicle_number: data.vehicle_number
          });
          
          if (data.status === 'completed') {
            setTripStatus('completed');
          }
        }
      } catch (err: any) {
        showError('Failed to load trip details');
        navigate('/trucker/my-trips');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile && tripId) fetchTrip();
  }, [tripId, userProfile, navigate, setTripStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      showError('You must be logged in to edit a trip.');
      return;
    }

    const capacity = parseFloat(formData.available_capacity_tonnes);
    const price = parseFloat(formData.price_per_tonne);

    if (isNaN(capacity) || capacity <= 0 || isNaN(price) || price <= 0) {
      showError('Please enter valid numeric values.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          origin_city: formData.origin_city.trim(),
          destination_city: formData.destination_city.trim(),
          departure_date: formData.departure_date,
          available_capacity_tonnes: capacity,
          price_per_tonne: price,
          vehicle_type: formData.vehicle_type.trim(),
          vehicle_number: formData.vehicle_number.trim(),
          status: tripStatus === 'completed' ? 'completed' : 'active'
        })
        .eq('id', tripId);

      if (error) {
        showError(error.message);
      } else {
        showSuccess('Trip updated successfully!');
        navigate('/trucker/my-trips');
      }
    } catch (err: any) {
      showError('An unexpected error occurred.');
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
            <Truck className="mr-2 text-orange-600" /> Edit Trip Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center text-xl font-bold text-gray-900">
                  Current Status: 
                  <span className={`ml-2 font-medium ${tripStatus === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                    {tripStatus === 'completed' ? 'COMPLETED' : 'ACTIVE'}
                  </span>
                </div>
              </div>
              
              {tripStatus !== 'completed' && (
                <div className="mt-4">
                  <Button type="button" onClick={() => setTripStatus('completed')} className="bg-orange-600 hover:bg-orange-700">
                    Mark as Completed
                  </Button>
                </div>
              )}
              
              {tripStatus === 'completed' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckIcon className="h-5 w-5" />
                  <span>Trip Completed</span>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-bold shadow-md" 
              disabled={saving} 
            >
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTrip;