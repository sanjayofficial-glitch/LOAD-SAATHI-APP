import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Request } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, Truck, Phone, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

const MyShipments = () => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase.from('requests').select('*, trip:trips(*)').eq('shipper_id', userProfile?.id);
      if (data) setRequests(data as Request[]);
    };
    fetchRequests();
  }, [userProfile]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Shipments</h1>
      <div className="grid gap-4">
        {requests.map(req => (
          <Card key={req.id}>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{req.goods_description}</h3>
                <p className="text-gray-500">{req.weight_tonnes} tonnes</p>
              </div>
              <Badge variant={req.status === 'accepted' ? 'default' : 'outline'}>{req.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyShipments;