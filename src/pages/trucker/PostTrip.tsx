import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, MapPin, Calendar, IndianRupee } from 'lucide-react';

const PostTrip = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin_city: '',
    destination_city: '',
    departure_date: '',
    available_capacity_tonnes: '',
    price_per_tonne: '',
    vehicle_type: '',
    vehicle_number: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('trips').insert({
      trucker_id: userProfile?.id,
      ...formData,
      available_capacity_tonnes: parseFloat(formData.available_capacity_tonnes),
      price_per_tonne: parseFloat(formData.price_per_tonne),
      status: 'active'
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Trip posted successfully!');
      navigate('/trucker/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 text-orange-600" />
            Post a New Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin City</Label>
                <Input value={formData.origin_city} onChange={(e) => setFormData({...formData, origin_city: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Destination City</Label>
                <Input value={formData.destination_city} onChange={(e) => setFormData({...formData, destination_city: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Input type="date" value={formData.departure_date} onChange={(e) => setFormData({...formData, departure_date: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity (Tonnes)</Label>
                <Input type="number" step="0.1" value={formData.available_capacity_tonnes} onChange={(e) => setFormData({...formData, available_capacity_tonnes: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Price per Tonne (₹)</Label>
                <Input type="number" value={formData.price_per_tonne} onChange={(e) => setFormData({...formData, price_per_tonne: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Input value={formData.vehicle_type} onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input value={formData.vehicle_number} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Posting...' : 'Post Trip'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostTrip;