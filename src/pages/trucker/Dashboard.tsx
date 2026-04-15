import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Truck, Clock, TrendingUp, PlusCircle, Search, DollarSign, Calendar, MapPin } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <Loader2 className="h-4 w-28 animate-spin" />
      <Loader2 className="h-4 w-4 rounded-full animate-spin" />
    </CardHeader>
    <CardContent>
      <Loader2 className="h-8 w-16 mt-1 animate-spin" />
    </CardContent>
  </Card>
);

const TruckerDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [stats, setStats] = useState<{
    activeTrips: number;
    pendingRequests: number;
    completedTrips: number;
    totalEarnings: number;
    upcomingTrips: any[];
  }>({
    activeTrips: 0,
    pendingRequests: 0,
    completedTrips: 0,
    totalEarnings: 0,
    upcomingTrips: [],
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    if (!userProfile?.id) return;
    try {
      const supabaseToken = await getToken({ template: "supabase" });
      if (!supabaseToken) throw new Error("No Supabase token");
      const supabase = createClerkSupabaseClient(supabaseToken);

      const { count: activeTrips } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("trucker_id", userProfile.id)
        .eq("status", "active");

      const { count: completedTrips } = await supabase        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("trucker_id", userProfile.id)
        .eq("status", "completed");

      const { data: myTrips } = await supabase
        .from("trips")
        .select("id")
        .eq("trucker_id", userProfile.id)
        .eq("status", "active");

      const tripIds = myTrips?.map((t) => t.id) || [];

      let pendingRequests = 0;
      if (tripIds.length > 0) {
        const { count } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .in("trip_id", tripIds)
          .eq("status", "pending");
        pendingRequests = count || 0;
      }

      const { data: completedTripsData } = await supabase.from("trips")
        .select("price_per_tonne, requests!inner(weight_tonnes)")
        .eq("trucker_id", userProfile.id)
        .eq("status", "completed");

      const totalEarnings = completedTripsData?.reduce((sum, trip) => {
        const request = trip.requests?.[0];
        return sum + (request ? trip.price_per_tonne * request.weight_tonnes : 0);
      }, 0) || 0;

      const { data: upcomingTrips } = await supabase.from("trips")
        .select("origin_city, destination_city, departure_date, price_per_tonne, vehicle_type")
        .eq("trucker_id", userProfile.id)
        .eq("status", "active")
        .order("departure_date", { ascending: true })
        .limit(3);

      setStats({
        activeTrips: activeTrips || 0,
        pendingRequests,
        completedTrips: completedTrips || 0,
        totalEarnings,
        upcomingTrips: upcomingTrips || [],
      });
    } catch (err: any) {
      showError("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [userProfile, getToken]);

  const handleCompleteTrip = async (tripId: string) => {
    try {
      const supabaseToken = await getToken({ template: "supabase" });
      if (!supabaseToken) throw new Error("No Supabase token");
      const supabase = createClerkSupabaseClient(supabaseToken);
      const { error } = await supabase.from("trips").update({ status: "completed" }).eq("id", tripId);
      if (error) throw error;
      showSuccess("Trip marked as completed!");
      loadStats();
    } catch (err: any) {
      showError("Failed to complete trip");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Trucker Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {loading ? <Skeleton className="inline-block h-4 w-32 align-middle" /> : userProfile?.full_name}!
          Manage your trips and find new loads.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
                <Truck className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.activeTrips}</div></CardContent>
            </Card>
            <Card className={stats.pendingRequests > 0 ? "border-orange-500 ring-1 ring-orange-500" : "border-orange-100"}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className={stats.pendingRequests > 0 ? "text-orange-600 animate-pulse" : "text-yellow-600"} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.pendingRequests > 0 ? "text-orange-600" : ""}`}>
                  {stats.pendingRequests}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Trips</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.completedTrips}</div></CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">₹{stats.totalEarnings.toLocaleString()}</div></CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border-orange-100">
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Link to="/trucker/post-trip">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Post New Trip
              </Button>
            </Link>
            <Link to="/trucker/browse-shipments">
              <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                <Search className="mr-2 h-4 w-4" /> Find Goods to Carry
              </Button>
            </Link>
            <Link to="/trucker/my-trips">
              <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                <Truck className="mr-2 h-4 w-4" /> Manage My Trips
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">Check your trips and requests for the latest updates.</p>
            <div className="mt-4 space-y-2">
              <Link to="/trucker/my-requests" className="block text-sm text-orange-600 hover:underline">View My Requests →</Link>
              <Link to="/trucker/history" className="block text-sm text-orange-600 hover:underline">View History →</Link>
              <Link to="/profile" className="block text-sm text-orange-600 hover:underline">Update Profile →</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Trips */}
      {!loading && stats.upcomingTrips.length > 0 && (
        <Card className="border-orange-100">
          <CardHeader><CardTitle>Upcoming Trips</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingTrips.map((trip: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <Truck className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{trip.origin_city} → {trip.destination_city}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{new Date(trip.departure_date).toLocaleDateString()}</span>
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{trip.vehicle_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-green-600">₹{trip.price_per_tonne.toLocaleString()}/t</span>
                    <Button size="sm" variant="outline" onClick={() => handleCompleteTrip(trip.id)} className="border-green-200 text-green-700 hover:bg-green-50">
                      Complete
                    </Button>
                  </div>
                </div>
              ))} 
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TruckerDashboard;