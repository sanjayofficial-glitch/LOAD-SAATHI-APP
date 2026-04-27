"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Package, Check as CheckIcon, IndianRupee } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import LocationSelector from "@/components/LocationSelector";
import locationData from "@/data/locations.json";

const EditShipment = () => {
  const { shipmentId } = useParams();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Location state
  const [origin, setOrigin] = useState({ state: '', district: '', city: '' });
  const [destination, setDestination] = useState({ state: '', district: '', city: '' });
  
  const [formData, setFormData] = useState({
    goods_description: "",
    weight_tonnes: "",
    pickup_address: "",
    delivery_address: "",
    budget_per_tonne: ""
  });

  useEffect(() => {
    const fetchShipment = async () => {
      if (!shipmentId || !userProfile?.id) return;
      
      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        
        const supabase = createClerkSupabaseClient(supabaseToken);
        
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .eq('id', shipmentId)
          .single();
        
        if (error || !data) {
          showError('Failed to load shipment details');
          navigate('/shipper/my-shipments');
          return;
        }

        if (data.shipper_id !== userProfile.id) {
          showError('You do not have permission to edit this shipment');
          navigate('/shipper/my-shipments');
          return;
        }
        
        // Set location data
        setOrigin({
          state: data.origin_state || '',
          district: '',
          city: data.origin_city || ''
        });
        
        setDestination({
          state: data.destination_state || '',
          district: '',
          city: data.destination_city || ''
        });
        
        setFormData({
          goods_description: data.goods_description || "",
          weight_tonnes: data.weight_tonnes?.toString() || "",
          pickup_address: data.pickup_address || "",
          delivery_address: data.delivery_address || "",
          budget_per_tonne: data.budget_per_tonne?.toString() || ""
        });
        
      } catch (err: any) {
        console.error('[EditShipment] Error:', err);
        showError('Failed to load shipment details');
        navigate('/shipper/my-shipments');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile && shipmentId) fetchShipment();
  }, [shipmentId, userProfile, getToken, navigate]);

  const handleOriginChange = (value: { state: string; district: string; city: string }) => {
    setOrigin(value);
  };

  const handleDestinationChange = (value: { state: string; district: string; city: string }) => {
    setDestination(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      showError('You must be logged in to edit a shipment.');
      return;
    }

    if (!origin.city || !destination.city) {
      showError('Please select origin and destination locations');
      return;
    }

    const weight = parseFloat(formData.weight_tonnes);
    const budget = parseFloat(formData.budget_per_tonne);

    if (isNaN(weight) || weight <= 0) {
      showError('Please enter a valid weight.');
      return;
    }

    if (isNaN(budget) || budget <= 0) {
      showError('Please enter a valid budget.');
      return;
    }

    setSaving(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('shipments')
        .update({
          origin_city: origin.city,
          origin_state: origin.state,
          destination_city: destination.city,
          destination_state: destination.state,
          goods_description: formData.goods_description.trim(),
          weight_tonnes: weight,
          pickup_address: formData.pickup_address.trim(),
          delivery_address: formData.delivery_address.trim(),
          budget_per_tonne: budget,
        })
        .eq('id', shipmentId);

      if (error) throw error;

      showSuccess('Shipment updated successfully!');
      navigate('/shipper/my-shipments');
    } catch (err: any) {
      console.error('[EditShipment] Error:', err);
      showError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="border-blue-100 shadow-lg">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
          <CardTitle className="flex items-center text-blue-900">
            <Package className="mr-2 text-blue-600" />
            Edit Shipment Details
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

            <div className="space-y-2">
              <Label htmlFor="goods">Goods Description</Label>
              <Textarea 
                id="goods"
                placeholder="What are you shipping? (e.g. 100 bags of rice)"
                value={formData.goods_description} 
                onChange={(e) => setFormData({...formData, goods_description: e.target.value})} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (Tonnes)</Label>
                <Input 
                  id="weight"
                  type="number" 
                  step="0.1" 
                  placeholder="e.g. 5.0"
                  value={formData.weight_tonnes} 
                  onChange={(e) => setFormData({...formData, weight_tonnes: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget per Tonne (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="budget"
                    type="number" 
                    placeholder="e.g. 1500"
                    className="pl-10"
                    value={formData.budget_per_tonne} 
                    onChange={(e) => setFormData({...formData, budget_per_tonne: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pickup">Pickup Address</Label>
                <Input 
                  id="pickup"
                  placeholder="Full pickup address"
                  value={formData.pickup_address} 
                  onChange={(e) => setFormData({...formData, pickup_address: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery">Delivery Address</Label>
                <Input 
                  id="delivery"
                  placeholder="Full delivery address"
                  value={formData.delivery_address} 
                  onChange={(e) => setFormData({...formData, delivery_address: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold shadow-md transition-all hover:shadow-lg" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : <><CheckIcon className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditShipment;