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
import { Package, Phone, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import Star from '@/components/Star';

const MyShipments = () => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewedTrips, setReviewedTrips] = useState<Set<string>>(new Set());

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*, trip:trips(*, trucker:users(*))')
      .eq('shipper_id', userProfile?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      showError('Failed to fetch shipments');
    } else if (data) {
      // Map data to handle potential array returns from Supabase joins
      const mappedData = (data as any[]).map(req => ({
        ...req,
        trip: Array.isArray(req.trip) ? {
          ...req.trip[0],
          trucker: Array.isArray(req.trip[0]?.trucker) ? req.trip[0].trucker[0] : req.trip[0]?.trucker
        } : {
          ...req.trip,
          trucker: Array.isArray(req.trip?.trucker) ? req.trip.trucker[0] : req.trip?.trucker
        }
      })) as Request[];
      setRequests(mappedData);
    }
    setLoading(false);
  };

  const fetchReviewedTrips = async () => {
    if (!userProfile) return;
    
    const { data, error } = await supabase
      .from('reviews')
      .select('trip_id')
      .eq('shipper_id', userProfile.id);
    
    if (data) {
      setReviewedTrips(new Set(data.map(review => review.trip_id)));
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchRequests();
      fetchReviewedTrips();
    }
  }, [userProfile]);

  const handleSubmitReview = async (tripId: string, truckerId: string) => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase.from('reviews').insert({
        trip_id: tripId,
        shipper_id: userProfile?.id,
        trucker_id: truckerId,
        rating,
        comment: comment.trim() || null
      });

      if (error) {
        if (error.code === '23505') {
          showError('You have already reviewed this trip.');
        } else {
          showError('Failed to submit review. Please try again.');
        }
      } else {
        showSuccess('Thank you for your review!');
        setReviewedTrips(prev => new Set([...prev, tripId]));
        fetchRequests(); // Refresh to update the UI
      }
    } catch (err) {
      showError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
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
                            <Star filled className="h-4 w-4 text-orange-700" />
                          </div>
                          <div>
                            <p className="text-xs text-orange-800 font-medium">Trucker Contact</p>
                            <p className="text-sm font-bold text-orange-900">{req.trip.trucker.full_name}</p>
                            <div className="flex items-center text-xs text-orange-600">
                              <Star filled className="h-3 w-3 text-yellow-500 mr-1" />
                              {req.trip.trucker.rating?.toFixed(1) || '0.0'} Rating
                            </div>
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
                    {req.trip?.status === 'completed' && req.status === 'accepted' && !reviewedTrips.has(req.trip_id) && (
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
                                    <Star filled className="h-8 w-8" />
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
                              {submitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Submitting...
                                </>
                              ) : 'Submit Review'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {req.trip?.status === 'completed' && req.status === 'accepted' && reviewedTrips.has(req.trip_id) && (
                      <div className="text-center">
                        <div className="flex items-center text-green-600 mb-2">
                          <Star filled className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Already Rated</span>
                        </div>
                      </div>
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