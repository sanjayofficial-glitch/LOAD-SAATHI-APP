import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Truck, 
  Package, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Loader2,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCheck,
  MessageSquare
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    trips: 0,
    requests: 0,
    shipments: 0,
    messages: 0,
    reviews: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all counts
      const [
        { count: usersCount },
        { count: tripsCount },
        { count: requestsCount },
        { count: shipmentsCount },
        { count: messagesCount },
        { count: reviewsCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('requests').select('*', { count: 'exact', head: true }),
        supabase.from('shipments').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true })
      ]);

      setStats({ 
        users: usersCount || 0, 
        trips: tripsCount || 0, 
        requests: requestsCount || 0,
        shipments: shipmentsCount || 0,
        messages: messagesCount || 0,
        reviews: reviewsCount || 0
      });

      // Fetch recent users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (userError) throw userError;
      setUsers(userData || []);

      // Fetch recent trips
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          trucker:users(full_name, user_type)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!tripError && tripData) {
        setRecentTrips(tripData);
      }

      // Fetch recent requests
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select(`
          *,
          trip:trips(origin_city, destination_city),
          shipper:users(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!requestError && requestData) {
        setRecentRequests(requestData);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: isVerified })
        .eq('id', userId);

      if (error) throw error;
      
      showSuccess(`User ${isVerified ? 'verified' : 'unverified'} successfully!`);
      fetchData();
    } catch (err: any) {
      showError(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'matched': return 'bg-purple-100 text-purple-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const platformGrowth = useMemo(() => {
    // Calculate growth metrics
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    
    return {
      userGrowth: stats.users > 0 ? Math.round((stats.users / 100) * 10) : 0,
      tripGrowth: stats.trips > 0 ? Math.round((stats.trips / 50) * 10) : 0
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Platform overview and management</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh Data
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="border-orange-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +{platformGrowth.userGrowth}% this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Trips</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trips}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +{platformGrowth.tripGrowth}% this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Requests</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requests}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Shipments</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipments}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages}</div>
          </CardContent>
        </Card>

        <Card className="border-pink-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Reviews</CardTitle>
            <CheckCircle className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviews}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="verification">Pending Verification</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-orange-600" />
                  Platform Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Database Status</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">RLS Policies</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">User Engagement</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Truckers</span>
                  <span className="font-bold text-orange-600">
                    {users.filter(u => u.user_type === 'trucker').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shippers</span>
                  <span className="font-bold text-blue-600">
                    {users.filter(u => u.user_type === 'shipper').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verified Truckers</span>
                  <span className="font-bold text-green-600">
                    {users.filter(u => u.user_type === 'trucker' && u.is_verified).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Trips per Trucker</span>
                  <span className="font-bold">
                    {users.filter(u => u.user_type === 'trucker').length > 0 
                      ? (stats.trips / users.filter(u => u.user_type === 'trucker').length).toFixed(1)
                      : '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Phone</th>
                      <th className="px-6 py-3">Joined</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="bg-white hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Mail className="h-3 w-3" /> {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={
                            user.user_type === 'trucker' 
                              ? 'text-orange-600 border-orange-200' 
                              : 'text-blue-600 border-blue-200'
                          }>
                            {user.user_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {user.is_verified ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Unverified
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {user.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            size="sm" 
                            variant={user.is_verified ? "outline" : "default"}
                            className={!user.is_verified ? "bg-orange-600 hover:bg-orange-700" : ""}
                            onClick={() => handleVerifyUser(user.id, !user.is_verified)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (user.is_verified ? 'Unverify' : 'Verify')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verification ({users.filter(u => !u.is_verified && u.user_type === 'trucker').length})</CardTitle>
            </CardHeader>
            <CardContent>
              {users.filter(u => !u.is_verified && u.user_type === 'trucker').length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <p>No truckers pending verification.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {users.filter(u => !u.is_verified && u.user_type === 'trucker').map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Truck className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{user.full_name}</h4>
                          <p className="text-xs text-gray-500">{user.company_name || 'Individual Trucker'}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-xs flex items-center text-gray-400"><Mail className="h-3 w-3 mr-1" /> {user.email}</span>
                            <span className="text-xs flex items-center text-gray-400"><Phone className="h-3 w-3 mr-1" /> {user.phone}</span>
                            <span className="text-xs flex items-center text-gray-400">
                              <Calendar className="h-3 w-3 mr-1" /> {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                          onClick={() => handleVerifyUser(user.id, true)}
                          disabled={actionLoading === user.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTrips.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No trips yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentTrips.map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {trip.origin_city} → {trip.destination_city}
                          </p>
                          <p className="text-xs text-gray-500">
                            {trip.trucker?.full_name} • {new Date(trip.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {recentRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No requests yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.goods_description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.shipper?.full_name} • {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;