import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { showSuccess, showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Edit, 
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2
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

const MyShipments = () => {
  const { userProfile } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('shipper_id', userProfile?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      showError('Failed to fetch shipments');
    } else if (data) {
      setShipments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userProfile) fetchShipments();
  }, [userProfile]);

  const handleDeleteShipment = async (shipmentId: string) => {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', shipmentId);

    if (error) {
      showError('Failed to delete shipment. It might have active requests.');
    } else {
      showSuccess('Shipment deleted successfully');
      fetchShipments();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Shipments</h1>
          <p className="text-gray-500">Manage your posted shipments and track their status</p>
        </div>
        <Link to="/shipper/post-shipment">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
            Post New Shipment
          </Button>
        </Link>
      </div>

      {shipments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No shipments posted yet</h3>
          <p className="text-gray-500 mb-6">Start by posting your first shipment</p>
          <Link to="/shipper/post-shipment">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Post Your First Shipment
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {shipments.map(shipment => (
            <Card key={shipment.id} className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-xl font-bold text-gray-900">
                        {shipment.origin_city} → {shipment.destination_city}
                      </div>
                      <Badge variant={shipment.status === 'pending' ? 'default' : 'secondary'} className={
                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : 
                        shipment.status === 'matched' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                        shipment.status === 'completed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {shipment.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        {new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-purple-600" />
                        {shipment.weight_tonnes} Tonnes
                      </div>
                      <div className="flex items-center font-semibold text-gray-900">
                        <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                        {shipment.budget_per_tonne.toLocaleString()} /t
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Goods:</p>
                      <p className="text-sm text-gray-600">{shipment.goods_description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pickup</p>
                        <p className="text-gray-700">{shipment.pickup_address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Delivery</p>
                        <p className="text-gray-700">{shipment.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    <Link to={`/shipments/${shipment.id}`}>
                      <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    
                    {shipment.status === 'pending' && (
                      <>
                        <Link to={`/shipper/edit-shipment/${shipment.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your shipment listing. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteShipment(shipment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}

                    {shipment.status === 'matched' && (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Matched with trucker
                      </div>
                    )}

                    {shipment.status === 'completed' && (
                      <div className="flex items-center text-blue-600 text-sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Completed
                      </div>
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

export default MyShipments;