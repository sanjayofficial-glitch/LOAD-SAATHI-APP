import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Request } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { showSuccess, showError } from '@/utils/toast';
import { Package, Star, Phone, MapPin, MessageSquare } from 'lucide-react';

const MyShipments = () => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('requests')
      .select('*, trip:trips(*, trucker:users(*))')
      .eq('shipper_id', userProfile?.id)
      .order('created_at', { ascending: false });
    
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    if (userProfile) fetchRequests();
  }, [userProfile]);

  const handleSubmitReview = async (tripId: string, truckerId: string) => {
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      trip_id: tripId,
      shipper_id: userProfile?.id,
      trucker_id: truckerId,
      rating,
      comment
    });

    if (error) {
      showError('You have already reviewed this trip or something went wrong.');
    } else {
      showSuccess('Thank you for your review!');
      fetchRequests();
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Shipments</h1>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No shipments found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map(req => (
            <Card key={req.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{req.goods_description}</h3>
                      <Badge variant={
                        req.status === 'accepted' ? 'default' : 
                        req.status === 'pending' ? 'outline' : 'destructive'
                      } className={req.status === 'accepted' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                        {req.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                        {req.trip?.origin_city} → {req.trip?.destination_city}
                      </div>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-blue-600" />
                        {req.weight_tonnes} Tonnes
                      </div>
                    </div>

                    {req.status === 'accepted' && req.trip?.trucker && (
                      <div className="bg-orange-50 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center mr-3">
                            <Star className="h-4 w-4 text-orange-700" />
                          </div>
                          <div>
                            <p className="text-xs text-orange-800 font-medium">Trucker Contact</p>
                            <p className="text-sm font-bold text-orange-900">{req.trip.trucker.full_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/chat/${req.id}`}>
                            <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                          </Link>
                          <a href={`tel:${req.trip.trucker.phone}`}>
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center items-end gap-3">
                    {req.trip?.status === 'completed' && req.status === 'accepted' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                            <Star className="h-4 w-4 mr-2" />
                            Rate Trucker
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rate your experience with {req.trip.trucker?.full_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Rating (1-5 Stars)</Label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setRating(s)}
                                    className={`p-2 rounded-md transition-colors ${
                                      rating >= s ? 'text-yellow-500' : 'text-gray-300'
                                    }`}
                                  >
                                    <Star className="h-8 w-8 fill-current" />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Comment (Optional)</Label>
                              <Input 
                                placeholder="How was the service?" 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                              />
                            </div>
                            <Button 
                              className="w-full bg-orange-600" 
                              onClick={() => handleSubmitReview(req.trip_id, req.trip.trucker_id)}
                              disabled={submitting}
                            >
                              {submitting ? 'Submitting...' : 'Submit Review'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Requested on</p>
                      <p className="text-sm font-medium">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyShipments;