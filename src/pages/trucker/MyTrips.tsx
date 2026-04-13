"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Edit, 
  Trash2,
  Eye,
  Loader2,
  ArrowRight,
  Plus
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MyTrips = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      const supabase = await getAuthenticatedClient();
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (err: any) {
      showError('Failed to fetch your trips');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) throw error;
      showSuccess('Trip deleted successfully');
      fetchTrips();
    } catch (err: any) {
      showError('Failed to delete trip');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-500">Manage your posted trips and available truck space</p>
        </div>
        <Link to="/trucker/post-trip">
          <Button className="bg-orange-600 hover:bg-orange-700 shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Post New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No trips posted yet</h3>
          <p className="text-gray-500 mb-6">Start by posting your first trip to find loads</p>
          <Link to="/trucker/post-trip">
            <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
              Post Your First Trip
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {trips.map(trip => (
            <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-xl font-bold text-gray-900">
                        {trip.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {trip.destination_city}
                      </div>
                      <Badge className={
                        trip.status === 'active' ? 'bg-green-100 text-green-700' : 
                        trip.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {trip.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-orange-600" />{new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      <div className="flex items-center"><Truck className="h-4 w-4 mr-2 text-blue-600" />{trip.available_capacity_tonnes}t available</div>
                      <div className="flex items-center font-semibold text-gray-900"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{trip.price_per_tonne.toLocaleString()} /t</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    <Link to={`/trucker/trips/${trip.id}`}><Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50"><Eye className="h-4 w-4 mr-2" />View</Button></Link>
                    {trip.status === 'active' && (
                      <>
                        <Link to={`/trucker/trips/${trip.id}/edit`}><Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4 mr-2" />Edit</Button></Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete your trip listing.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTrip(trip.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
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

export default MyTrips;