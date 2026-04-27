"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';  
import { Label } from '@/components/ui/label';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';  
import { showSuccess, showError } from '@/utils/toast';  
import { Truck, Calendar, IndianRupee, Loader2, ArrowLeft } from 'lucide-react';  
import LocationSelector from '@/components/LocationSelector';  
import locationData from '@/data/locations.json';

const EditTrip = () => {  
  const { tripId } = useParams();  
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();  
  const [loading, setLoading] = useState(true);  
  const [saving, setSaving] = useState(false);  
  const [formData, setFormData] = useState({  
    origin_city: '',  
    origin_state: '',
    destination_city: '',  
    destination_state: '',
    departure_date: '',      
    available_capacity_tonnes: '',  
    price_per_tonne: '',  
    vehicle_type: '',  
    vehicle_number: ''  
  });  

  useEffect(() => {  
    const fetchTrip = async () => {  
      if (!tripId) return;  
      
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;
        const supabase = createClerkSupabaseClient(token);

        const { data, error } = await supabase  
          .from('trips')  
          .select('*')  
          .eq('id', tripId)  
          .single();  

        if (error) throw error;

        if (data) {  
          if (data.trucker_id !== userProfile?.id) {  
            showError('Unauthorized access');  
            navigate('/trucker/my-trips');  
            return;  
          }  
          setFormData({  
            origin_city: data.origin_city,  
            origin_state: data.origin_state || '',
            destination_city: data.destination_city,  
            destination_state: data.destination_state || '',
            departure_date: data.departure_date,  
            available_capacity_tonnes: data.available_capacity_tonnes.toString(),  
            price_per_tonne: data.price_per_tonne.toString(),  
            vehicle_type: data.vehicle_type,            
            vehicle_number: data.vehicle_number          
          });  
        }  
      } catch (err: any) {
        showError('Failed to load trip details');
        navigate('/trucker/my-trips');
      } finally {
        setLoading(false);
      }
    };  

    if (userProfile && tripId) fetchTrip();  
  }, [tripId, userProfile, navigate, getToken]);  

  const handleLocationChange = (field: 'origin' | 'destination', value: { state: string; district: string; city: string }) => {  
    setFormData(prev => ({  
      ...prev,  
      [`${field}_city`]: value.city,
      [`${field}_state`]: value.state
    }));  
  };  

  const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();      
    const capacity = parseFloat(formData.available_capacity_tonnes);  
    const price = parseFloat(formData.price_per_tonne);  

    if (isNaN(capacity) || capacity <= 0 || isNaN(price) || price <= 0) {  
      showError('Please enter valid numeric values.');  
      return;  
    }  

    setSaving(true);  
    try {  
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('Auth failed');
      const supabase = createClerkSupabaseClient(token);

      const { error } = await supabase  
        .from('trips')  
        .update({  
          origin_city: formData.origin_city.trim(),  
          origin_state: formData.origin_state,
          destination_city: formData.destination_city.trim(),  
          destination_state: formData.destination_state,
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
      showError(err.message || 'An unexpected error occurred.');  
    } finally {        
      setSaving(false);  
    }  
  };  

  if (loading) return (  
    <div className="flex items-center justify-center min-h-[400px]">  
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
                value={{ state: formData.origin_state, district: '', city: formData.origin_city }}
                onChange={(value) => handleLocationChange('origin', value)}  
              />  
            </div>  

            <div className="space-y-2">  
              <Label className="text-gray-700 font-medium">Destination Location</Label>                
              <LocationSelector  
                label="Destination"  
                data={locationData.data}  
                value={{ state: formData.destination_state, district: '', city: formData.destination_city }}
                onChange={(value) => handleLocationChange('destination', value)}                
              />  
            </div>              

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">  
              <div className="space-y-2">                  
                <Label htmlFor="capacity">Available Capacity (Tonnes)</Label>  
                <Input  
                  id="capacity"  
                  type="number"  
                  step="0.1"  
                  value={formData.available_capacity_tonnes}  
                  onChange={(e) => setFormData({...formData, available_capacity_tonnes: e.target.value})}  
                  required  
                />  
              </div>  

              <div className="space-y-2">  
                <Label htmlFor="price">Price per Tonne (₹)</Label>  
                <div className="relative">  
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />  
                  <Input  
                    id="price"  
                    type="number"  
                    className="pl-10"  
                    value={formData.price_per_tonne}  
                    onChange={(e) => setFormData({...formData, price_per_tonne: e.target.value})}                      
                    required  
                  />  
                </div>  
              </div>              
            </div>  

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">  
              <div className="space-y-2">  
                <Label htmlFor="vehicleType">Vehicle Type</Label>  
                <Input  
                  id="vehicleType"  
                  value={formData.vehicle_type}  
                  onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}  
                  required  
                />  
              </div>  

              <div className="space-y-2">  
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>                  
                <Input  
                  id="vehicleNumber"  
                  value={formData.vehicle_number}  
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}  
                  required  
                />  
              </div>  
            </div>  

            <div className="flex gap-4 pt-4">  
              <Button  
                type="button"  
                variant="outline"  
                className="flex-1"  
                onClick={() => navigate('/trucker/my-trips')}  
              >                  
                Cancel  
              </Button>                
              <Button  
                type="submit"  
                className="flex-1 bg-orange-600 hover:bg-orange-700"  
                disabled={saving}  
              >  
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Save Changes'}  
              </Button>              
            </div>  
          </form>  
        </CardContent>  
      </Card>  
    </div>  
  );  
};

export default EditTrip;