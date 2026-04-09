import { useState } from 'react';  import { useNavigate } from 'react-router-dom';  
import { useAuth } from '@/contexts/AuthContext';  
import { useSupabase } from '@/hooks/useSupabase';  import { Button } from '@/components/ui/button';  
import { Input } from '@/components/ui/input';  
import { Label } from '@/components/ui/label';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';  
import { showSuccess, showError } from '@/utils/toast';  
import { Truck, MapPin, Calendar, IndianRupee, Loader2 } from 'lucide-react';  import LocationSelector from '@/components/LocationSelector';  
import locationData from '@/data/locations.json';  

const PostTrip = () => {  
  const { userProfile } = useAuth();  
  const { getAuthenticatedClient } = useSupabase();    const navigate = useNavigate();  
  const [loading, setLoading] = useState(false);  
  const [formData, setFormData] = useState({      origin_city: '',  
    destination_city: '',  
    departure_date: '',  
    available_capacity_tonnes: '',  
    price_per_tonne: '',  
    vehicle_type: '',  
    vehicle_number: ''  
  });    const handleLocationChange = (field: 'origin_city' | 'destination_city', value: { state: string; district: string; city: string }) => {      setFormData(prev => ({  
      ...prev,  
      [field]: value.city      }));  
  };    const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();  
    
    if (!userProfile?.id) {  
      showError('You must be logged in to post a trip.');  
      return;      }      const capacity = parseFloat(formData.available_capacity_tonnes);  
    const price = parseFloat(formData.price_per_tonne);  

    if (isNaN(capacity) || capacity <= 0) {  
      showError('Please enter a valid capacity in tonnes.');  
      return;  
    }      if (isNaN(price) || price <= 0) {        showError('Please enter a valid price per tonne.');  
      return;  
    }  

    setLoading(true);  
    try {  
      const supabase = await getAuthenticatedClient();        const { error } = await supabase.from('trips').insert({  
        trucker_id: userProfile.id,  
        origin_city: formData.origin_city.trim(),  
        destination_city: formData.destination_city.trim(),          departure_date: formData.departure_date,  
        available_capacity_tonnes: capacity,  
        price_per_tonne: price,  
        vehicle_type: formData.vehicle_type.trim(),  
        vehicle_number: formData.vehicle_number.trim(),  
        status: 'active'        });  

      if (error) {  
        showError(error.message);        } else {  
        showSuccess('Trip posted successfully!');  
        navigate('/trucker/dashboard');  
      }      } catch (err: any) {  
      showError(err.message || 'An unexpected error occurred while posting the trip.');      } finally {        setLoading(false);  
    }  
  };    return (      <div className="container mx-auto px-4 py-8 max-w-2xl">  
      <Card className="border-orange-100 shadow-lg">  
        <CardHeader className="bg-orange-50/50 border-b border-orange-100">  
          <CardTitle className="flex items-center text-orange-900">  
            <Truck className="mr-2 text-orange-600" />              Post a New Trip  
          </CardTitle>          </CardHeader>          <CardContent className="pt-6">            <form onSubmit={handleSubmit} className="space-y-6">              <div className="space-y-2">  
              <Label className="text-gray-700 font-medium">Origin Location</Label>  
              <LocationSelector                  label="Origin"  
                data={locationData.data}  
                onChange={(value) => handleLocationChange('origin_city', value)}  
              />  
            </div>  

            <div className="space-y-2">  
              <Label className="text-gray-700 font-medium">Destination Location</Label>  
              <LocationSelector  
                label="Destination"                  data={locationData.data}  
                onChange={(value) => handleLocationChange('destination_city', value)}  
              />              </div>  

            <div className="space-y-2">                <Label htmlFor="date">Departure Date</Label>  
              <div className="relative">  
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />  
                <Input  
                  id="date"  
                  type="date"                    className="pl-10"  
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

              <div className="space-y-2">                  <Label htmlFor="price">Price per Tonne (₹)</Label>                  <div className="relative">                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />  
                  <Input  
                    id="price"  
                    type="number"  
                    className="pl-10"  
                    value={formData.price_per_tonne}                      onChange={(e) => setFormData({...formData, price_per_tonne: e.target.value})}  
                    required  
                  />  
                </div>                </div>  
            </div>  

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">  
              <div className="space-y-2">  
                <Label htmlFor="vehicleType">Vehicle Type</Label>  
                <Input  
                  id="vehicleType"  
                  placeholder="e.g. 12-Wheeler Truck"  
                  value={formData.vehicle_type}  
                  onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}  
                  required  
                />  
              </div>  

              <div className="space-y-2">  
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>                  <Input  
                  id="vehicleNumber"  
                  placeholder="e.g. RJ 14 GB 1234"  
                  value={formData.vehicle_number}  
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}  
                  required  
                />  
              </div>  
              </div>                <div className="flex gap-4">  
                <Button  
                  type="button"                    variant="outline"  
                  className="flex-1"  
                  onClick={() => navigate('/trucker/dashboard')}                  >                  Cancel  
              </Button>                <Button  
                  type="submit"  
                  className="flex-1 bg-orange-600 hover:bg-orange-700"  
                  disabled={loading}  
                >  
                  {loading ? (  
                    <>  
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />  
                      Posting Trip...  
                    </>  
                  ) : 'Post Trip'}                  </Button>  
              </div>  
            </form>            </CardContent>  
        </Card>  
      </div>  
    </div>  
  );  
};

export default PostTrip;