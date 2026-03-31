import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
  Phone
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, trips: 0, requests: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: tripsCount } = await supabase.from('trips').select('*', { count: 'exact', head: true });
      const { count: requestsCount } = await supabase.from('requests').select('*', { count: 'exact', head: true });
      
      setStats({ 
        users: usersCount || 0, 
        trips: tripsCount || 0, 
        requests: requestsCount || 0 
      });

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) throw userError;
      setUsers(userData || []);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Platform overview and user management</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh Data
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Trips</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trips}</div>
          </CardContent>
        </Card>
        <Card className="border-green-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requests}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="verification">Pending Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Status</th>
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
                          <Badge variant="outline" className={user.user_type === 'trucker' ? 'text-orange-600 border-orange-200' : 'text-blue-600 border-blue-200'}>
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
              <CardTitle>Pending Verification</CardTitle>
            </CardHeader>
            <CardContent>
              {users.filter(u => !u.is_verified && u.user_type === 'trucker').length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No truckers pending verification.
                </div>
              ) : (
                <div className="grid gap-4">
                  {users.filter(u => !u.is_verified && u.user_type === 'trucker').map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{user.full_name}</h4>
                          <p className="text-xs text-gray-500">{user.company_name || 'Individual Trucker'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs flex items-center text-gray-400"><Mail className="h-3 w-3 mr-1" /> {user.email}</span>
                            <span className="text-xs flex items-center text-gray-400"><Phone className="h-3 w-3 mr-1" /> {user.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerifyUser(user.id, true)}
                          disabled={actionLoading === user.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
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
      </Tabs>
    </div>
  );
};

export default AdminDashboard;