"use client";

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const MyTrips = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchTrips = async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await supabase.from("trips").select("*").eq("trucker_id", userProfile.id).order("created_at", { ascending: false });
      const { data, error } = await supabase;
      if (!error) setTrips(data || []);
    } catch (err) {
      showError("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    setDeleteLoading(tripId);
    try {
      const supabase = await supabase.from("trips").delete().eq("id", tripId);
      if (!supabase.error) {
        showSuccess("Trip deleted successfully");
        fetchTrips();
      } else throw supabase.error;
    } catch (err) {
      showError("Failed to delete trip");
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [userProfile?.id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trucker Hub</h1>
          <p className="text-gray-500">Manage your trips and bookings</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 shadow-md">
          Post New Trip
        </Button>
      </div>

      <div className="space-y-6">
        {trips.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-500 mb-6">Start by posting a trip to find loads</p>
            <Button href="/trucker/post-trip" className="bg-orange-600 hover:bg-orange-700">
              Post Your First Trip
            </Button>
          </div>
        ) : (
          trips.map(trip => (
            <Card key={trip.id} className="overflow-hidden border-orange-100 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-xl font-bold text-gray-900">
                        {trip.origin_city} <ArrowLeft className="h-4 w-4 mx-2 text-gray-400" /> {trip.destination_city}
                      </div>
                      <Badge className={trip.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}>
                        {trip.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />{new Date(trip.departure_date).toLocaleDateString('en-IN', { day: "numeric", month: "short" })}</div>
                      <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-purple-600" />{trip.available_capacity_tonnes}t</div>
                      <div className="flex items-center font-semibold text-gray-900"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{trip.price_per_tonne.toLocaleString()}/t</div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between mt-4">
                    <Link href={`/trucker/trip/${trip.id}`} className="block">
                      <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Eye className="h-4 w-4 mr-2" /> View                      </Button>
                    </Link>
                    {trip.status === "pending" && (
                      <>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 shadow-md"
                          onClick={() => navigate(`/chat/${trip.id}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" /> Chat
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteTrip(trip.id)}
                          disabled={deleteLoading === trip.id}
                        >
                          {deleteLoading === trip.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </>
                    )}
                    {trip.status !== "pending" && (
                      <Button
                        variant="outline"
                        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                        disabled={deleteLoading === trip.id}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        )}
      </div>
    </div>
  );
};

export default MyTrips;