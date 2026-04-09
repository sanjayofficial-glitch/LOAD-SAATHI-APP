"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { Truck, MapPin, Calendar, IndianRupee, Loader2, ArrowLeft } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import locationData from "@/data/locations.json";

const PostTrip = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin_city: "",
    destination_city: "",
    departure_date: "",
    goods_description: "",
    weight_tonnes: "",
    pickup_address: "",
    delivery_address: "",
    budget_per_tonne: "",
  });

  const handleLocationChange = (field: "origin_city" | "destination_city", value: { state: string; district: string; city: string }) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.city,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weight = parseFloat(formData.weight_tonnes);
    const budget = parseFloat(formData.budget_per_tonne);

    if (isNaN(weight) || weight <= 0) {
      showError("Please enter a valid weight.");
      return;
    }

    if (isNaN(budget) || budget <= 0) {
      showError("Please enter a valid budget.");
      return;
    }

    setLoading(true);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from("shipments").insert({
        shipper_id: userProfile!.id,
        origin_city: formData.origin_city.trim(),
        destination_city: formData.destination_city.trim(),
        departure_date: formData.departure_date,
        goods_description: formData.goods_description.trim(),
        weight_tonnes: weight,
        pickup_address: formData.pickup_address.trim(),
        delivery_address: formData.delivery_address.trim(),
        budget_per_tonne: budget,
        status: "pending",
      });

      if (error) throw error;
      showSuccess("Shipment posted successfully!");
      navigate("/shipper/my-shipments");
    } catch (err: any) {
      showError(err.message || "Failed to post shipment");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Shipments
      </Button>

      <Card className="border-blue-100 shadow-lg">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
          <CardTitle className="flex items-center text-blue-900">
            <Package className="mr-2 text-blue-600" /> Post a New Shipment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Origin Location</Label>
              <LocationSelector
                label="Origin"
                data={locationData.data}
                onChange={(value) => handleLocationChange("origin_city", value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Destination Location</Label>
              <LocationSelector
                label="Destination"
                data={locationData.data}
                onChange={(value) => handleLocationChange("destination_city", value)}
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
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goods">Goods Description</Label>
              <Input
                id="goods"
                value={formData.goods_description}
                onChange={(e) => setFormData({ ...formData, goods_description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (Tonnes)</Label>
                <Input                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight_tonnes}
                  onChange={(e) => setFormData({ ...formData, weight_tonnes: e.target.value })}
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
                    className="pl-10"
                    value={formData.budget_per_tonne}
                    onChange={(e) => setFormData({ ...formData, budget_per_tonne: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup Address</Label>
              <Input
                id="pickup"
                value={formData.pickup_address}
                onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery Address</Label>
              <Input                id="delivery"
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/shipper/my-shipments")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  "Post Shipment"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostTrip;