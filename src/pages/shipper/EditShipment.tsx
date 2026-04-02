import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, MapPin, Calendar, IndianRupee, Loader2, ArrowLeft } from 'lucide-react';

const EditShipment = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const { data, error } = await supabase
          .from('shipments')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          showError('Failed to load shipment details');
          navigate('/shipper/my-shipments');
        } else if (data) {
          if (data.shipper_id !== userProfile?.id) {
            showError('You do not have permission to edit this shipment');
            navigate('/shipper/my-shipments');
            return;
          }
          setFormData({
            origin_city: data.origin_city,
            destination_city: data.destination_city,
            departure_date: data.departure_date,
            goods_description: data.goods_description,
            weight_tonnes: data.weight_tonnes.toString(),
            pickup_address: data.pickup_address,
            delivery_address: data.delivery_address,
            budget_per_tonne: data.budget_per_tonne.toString()
          });
        }
      } catch (err) {
        showError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) fetchShipment();
  }, [id, userProfile, navigate, getAuthenticatedClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('shipments')
        .update({
          origin_city: formData.origin_city.trim(),
          destination_city: formData.destination_city.trim(),
          departure_date: formData.departure_date,
          goods_description: formData.goods_description.trim(),
          weight_tonnes: weight,
          pickup_address: formData.pickup_address.trim(),
          delivery_address: formData.delivery_address.trim(),
          budget_per_tonne: budget
        })
        .eq('id', id);

      if (error) {
        showError(error.message);
      } else {
        showSuccess('Shipment updated successfully!');
        navigate('/shipper/my-shipments');
      }
    } catch (err) {
      showError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Shipments
      </Button>

      <Card className="border-blue-100 shadow-lg">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
          <CardTitle className="flex items-center text-blue-900">
            <Truck className="mr-2 text-blue-600" /> Edit Shipment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="origin"
                    className="pl-10"
                    value={formData.origin_city}
                    onChange={(e) => setFormData({...formData, origin_city: e.target.value})}
                    placeholder="Enter origin city"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="destination"
                    className="pl-10"
                    value={formData.destination_city}
                    onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                    placeholder="Enter destination city"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Departure Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input                  id="date"
                  type="date"
                  className="pl-10"
                  value={formData.departure_date}
                  onChange={(e) => setFormData({...formData, departure_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goods">Goods Description</Label>
              <Input
                id="goods"
                className="pl-10"
                value={formData.goods_description}
                onChange={(e) => setFormData({...formData, goods_description: e.target.value})}
                placeholder="Enter goods description"
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
                  className="pl-10"
                  value={formData.weight_tonnes}
                  onChange={(e) => setFormData({...formData, weight_tonnes: e.target.value})}
                  placeholder="e.g. 5.0"
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
                    onChange={(e) => setFormData({...formData, budget_per_tonne: e.target.value})}
                    placeholder="e.g. 2500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup Address</Label>
              <Input
                id="pickup"
                className="pl-10"
                value={formData.pickup_address}
                onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                placeholder="Enter pickup address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery">Delivery Address</Label>
              <Input
                id="delivery"
                className="pl-10"
                value={formData.delivery_address}
                onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                placeholder="Enter delivery address"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/shipper/my-shipments')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditShipment;