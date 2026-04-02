import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Clock, TrendingUp, PlusCircle, DollarSign, Calendar, MapPin } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [stats, setStats] = useState({ 
    activeShipments: 0, 
    pendingRequests: 0, 
    completedShipments: 0,
    totalSpent: 0,
    upcomingShipments: []
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    if (!userProfile?.id) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);

      // Active shipments
      const { count: activeShipments } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending');
      
      // Completed shipments
      const { count: completedShipments } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'completed');
      
      // Pending requests
      const { count: pendingRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending');

      // Total spent from completed shipments      const { data: completedShipmentsData } = await supabase
        .from('shipments')
        .select('budget_per_tonne, requests!inner(weight_tonnes)')
        .eq('shipper_id', userProfile.id)
        .eq('status', 'completed');

      const totalSpent = completedShipmentsData?.reduce((sum, shipment) => {
        const request = shipment.requests[0];
        return sum + (request ? shipment.budget_per_tonne * request.weight_tonnes : 0);
      }, 0) || 0;

      // Upcoming shipments
      const { data: upcomingShipments } = await supabase
        .from('shipments')
        .select('origin_city, destination_city, departure_date, goods_description, weight_tonnes')
        .eq('shipper_id', userProfile.id)
        .eq('status', 'pending')
        .order('departure_date', { ascending: true })
        .limit(3);

      setStats({ 
        activeShipments: activeShipments || 0, 
        pendingRequests: pendingRequests || 0, 
        completedShipments: completedShipments || 0,
        totalSpent,
        upcomingShipments: upcomingShipments || []
      });
    } catch (err: any) {
      showError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [userProfile, getToken]);

  const handleCancelShipment = async (shipmentId: string) => {
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('shipments')
        .update({ status: 'cancelled' })
        .eq('id', shipmentId);

      if (error) throw error;
      showSuccess('Shipment cancelled successfully!');
      loadStats();
    } catch (err: any) {
      showError('Failed to cancel shipment');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shipper Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userProfile?.full_name}! Manage your shipments and find trucks.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeShipments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Shipments</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.completedShipments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{loading ? '...' : stats.totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/shipper/post-shipment">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Post New Shipment
              </Button>
            </Link>
            <Link to="/browse-trucks">
              <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                <Search className="mr-2 h-4 w-4" /> Find Available Trucks
              </Button>
            </Link>
            <Link to="/shipper/my-shipments">
              <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                <Package className="mr-2 h-4 w-4" /> Manage My Shipments
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">Check your shipments and booking requests for the latest updates.</p>
            <div className="mt-4 space-y-2">
              <Link to="/shipper/my-shipments" className="block text-sm text-blue-600 hover:underline">View My Shipments →</Link>
              <Link to="/shipper/history" className="block text-sm text-blue-600 hover:underline">View History →</Link>
              <Link to="/profile" className="block text-sm text-blue-600 hover:underline">Update Profile →</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Shipments */}
      {stats.upcomingShipments.length > 0 && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle>Upcoming Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingShipments.map((shipment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {shipment.origin_city} → {shipment.destination_city}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(shipment.departure_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          {shipment.goods_description}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {shipment.weight_tonnes}t
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCancelShipment(shipment.id)}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Cancel                    </Button>
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

export default ShipperDashboard;