import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { Package, MapPin, Calendar, IndianRupee, Loader2 } from 'lucide-react';

const PostShipments = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin_city: '',
    destination_city: '',
    departure_date: '',
    goods_description: '',
    weight_tonnes: '',
    pickup_address: '',
    delivery_address: '',
    budget_per_tonne: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      showError('You must be logged in to post a shipment.');
      return;
    }

    // Validate numeric fields
    const weight = parseFloat(formData.weight_tonnes);
    const budget = parseFloat(formData.budget_per_tonne);

    if (isNaN(weight) || weight <= 0) {
      showError('Please enter a valid weight in tonnes.');
      return;
    }

    if (isNaN(budget) || budget <= 0) {
      showError('Please enter a valid budget per tonne.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('shipments').insert({
        shipper_id: userProfile.id,
        origin_city: formData.origin_city.trim(),
        destination_city: formData.destination_city.trim(),
        departure_date: formData.departure_date,
        goods_description: formData.goods_description.trim(),
        weight_tonnes: weight,
        pickup_address: formData.pickup_address.trim(),
        delivery_address: formData.delivery_address.trim(),
        budget_per_tonne: budget,
        status: 'pending'
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess('Shipment posted successfully!');
        navigate('/shipper/dashboard');
      }
    } catch (err) {
      showError('An unexpected error occurred while posting the shipment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-blue-100 shadow-lg">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
          <CardTitle className="flex items-center text-blue-900">
            <Package className="mr-2 text-blue-600" />
            Post a New Shipment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-gray-700 font-medium">Origin City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="origin"
                    placeholder="e.g. Jaipur"
                    className="pl-10"
                    value={formData.origin_city} 
                    onChange={(e) => setFormData({...formData, origin_city: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-gray-700 font-medium">Destination City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="destination"
                    placeholder="e.g. Delhi"
                    className="pl-10"
                    value={formData.destination_city} 
                    onChange={(e) => setFormData({...formData, destination_city: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-gray-700 font-medium">Departure Date</Label>
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
              <Label htmlFor="goods" className="text-gray-700 font-medium">Goods Description</Label>
              <Input 
                id="goods"
                placeholder="e.g. Cotton fabric, Electronics, Machinery parts, etc."
                value={formData.goods_description} 
                onChange={(e) => setFormData({...formData, goods_description: e.target.value})} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-gray-700 font-medium">Weight (Tonnes)</Label>
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
                <Label htmlFor="budget" className="text-gray-700 font-medium">Budget per Tonne (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="budget"
                    type="number" 
                    placeholder="e.g. 2500"
                    className="pl-10"
                    value={formData.budget_per_tonne} 
                    onChange={(e) => setFormData({...formData, budget_per_tonne: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup" className="text-gray-700 font-medium">Pickup Address</Label>
              <Input 
                id="pickup"
                placeholder="e.g., Warehouse A, Industrial Area, Jaipur"
                value={formData.pickup_address} 
                onChange={(e) => setFormData({...formData, pickup_address: e.target.value})} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery" className="text-gray-700 font-medium">Delivery Address</Label>
              <Input 
                id="delivery"
                placeholder="e.g., Factory B, Industrial Estate, Delhi"
                value={formData.delivery_address} 
                onChange={(e) => setFormData({...formData, delivery_address: e.target.value})} 
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold shadow-md transition-all hover:shadow-lg" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Posting Shipment...
                </>
              ) : 'Post Shipment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostShipments;