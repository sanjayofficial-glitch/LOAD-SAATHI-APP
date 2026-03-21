import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Package, CheckCircle, IndianRupee, Star } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, trips: 0, requests: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: trips } = await supabase.from('trips').select('*', { count: 'exact', head: true });
      const { count: requests } = await supabase.from('requests').select('*', { count: 'exact', head: true });
      setStats({ users: users || 0, trips: trips || 0, requests: requests || 0 });
    };
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.users}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Truck className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.trips}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.requests}</div></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;