"use client";

import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Calendar, 
  IndianRupee, 
  Loader2, 
  ArrowRight,
  Eye,
  Trash2,
  Edit,
  Inbox,
  Send,
  MessageSquare,
  Phone,
  Check,
  X
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from '@/utils/toast';

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    declined: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const MyShipments = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'loads';

  const [myLoads, setMyLoads] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      const { data: loads } = await supabase
        .from('shipments')
        .select('*')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      const { data: sent } = await supabase
        .from('requests')
        .select(`*, trip:trips(*, trucker:users(*))`)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      const { data: incoming } = await supabase
        .from('shipment_requests')
        .select(`*, shipment:shipments!inner(*), trucker:users!shipment_requests_trucker_id_fkey(*)`)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      setMyLoads(loads || []);
      setSentRequests(sent || []);
      setIncomingOffers(incoming || []);
    } catch (err: any) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteShipment = async (id: string) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Shipment deleted');
      loadData();
    } catch (err) {
      showError('Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Shipments</h1>
        <p className="text-gray-500">Manage your posted loads and booking requests</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="loads">My Loads</TabsTrigger>
          <TabsTrigger value="sent">Sent Requests</TabsTrigger>
          <TabsTrigger value="incoming">Incoming Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="loads">
          <div className="grid gap-6">
            {myLoads.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">You haven't posted any shipments yet.</p>
                <Link to="/shipper/post-shipment" className="mt-4 inline-block">
                  <Button className="bg-blue-600">Post New Shipment</Button>
                </Link>
              </div>
            ) : (
              myLoads.map(shipment => (
                <Card key={shipment.id} className="border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-bold">
                            {shipment.origin_city} <ArrowRight className="h-4 w-4 inline mx-2" /> {shipment.destination_city}
                          </div>
                          <StatusBadge status={shipment.status} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-500">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" />{new Date(shipment.departure_date).toLocaleDateString()}</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2" />{shipment.weight_tonnes}t</div>
                          <div className="flex items-center font-semibold text-gray-800"><IndianRupee className="h-4 w-4 mr-1" />{shipment.budget_per_tonne.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/shipper/shipments/${shipment.id}`}>
                          <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" />View</Button>
                        </Link>
                        {shipment.status === 'pending' && (
                          <>
                            <Link to={`/shipper/shipments/${shipment.id}/edit`}>
                              <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-2" />Edit</Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this shipment?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete your shipment listing.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteShipment(shipment.id)} className="bg-red-600">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Sent and Incoming tabs would follow similar patterns */}
      </Tabs>
    </div>
  );
};

export default MyShipments;