"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {  
  Truck, 
  Package,   
  Calendar, 
  IndianRupee, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Filter,
  X,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import locationData from "@/data/locations.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const INDIAN_STATES = Object.keys(locationData.data);

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

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    origin_city: '',
    destination_city: '',
    departure_date: '',
    goods_description: '',
    weight_tonnes: '',
    pickup_address: '',
    delivery_address: '',
    budget_per_tonne: ''
  });

  const [stats, setStats] = useState({
    activeShipments: 0,
    pendingRequests: 0,
    completedShipments: 0,
    totalSpent: 0,
    upcomingShipments: []
  });
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minWeight: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);

  // Fetch shipments data
  const fetchShipments = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (err: any) {
      showError('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    let result = [...shipments];
    if (filters.origin) {
      result = result.filter(s => 
        s.origin_city.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }
    if (filters.destination) {
      result = result.filter(s => 
        s.destination_city.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }
    if (filters.minWeight) {
      const minCap = parseFloat(filters.minWeight);
      result = result.filter(s => s.weight_tonnes >= minCap);
    }
    return result;
  }, [shipments, filters]);

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      if (!userProfile?.id) return;
      try {
        const supabase = await getAuthenticatedClient();
        
        const { count: activeShipments } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('shipper_id', userProfile.id)
          .eq('status', 'pending');

        const { count: completedShipments } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('shipper_id', userProfile.id)
          .eq('status', 'completed');
        
        const { count: pendingRequests } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('shipper_id', userProfile.id)
          .eq('status', 'pending');
        
        const { data: completedTrips } = await supabase
          .from('shipments')
          .select('budget_per_tonne, requests!inner(weight_tonnes)')
          .eq('shipper_id', userProfile.id)
          .eq('status', 'completed');
        
        const totalSpent = completedTrips?.reduce((sum, trip) => {
          const request = trip.requests?.[0];
          return sum + (request ? trip.budget_per_tonne * request.weight_tonnes : 0);
        }, 0) || 0;
        
        const { data: upcomingShipments } = await supabase
          .from('shipments')
          .select('origin_city, destination_city, departure_date, goods_description, weight_tonnes, id')
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
    loadStats();
  }, [userProfile?.id, getAuthenticatedClient]);

  const openOfferDialog = (shipment: any) => {
    setSelectedShipment(shipment);
    setIsOfferDialogOpen(true);
  };

  const submitOffer = async () => {
    if (!selectedShipment || !userProfile) return;

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price');
      return;
    }

    setSendingOffer(true);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.from('shipment_requests').insert({
        shipment_id: selectedShipment.id,
        trucker_id: userProfile.id,
        shipper_id: selectedShipment.shipper_id,
        proposed_price_per_tonne: price,
        message: message.trim(),
        status: 'pending'
      });

      if (error) throw error;
      
      showSuccess('Offer sent to shipper!');
      setIsOfferDialogOpen(false);
      navigate('/shipper/my-shipments?tab=sent');
    } catch (err: any) {
      showError(err.message || 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      minWeight: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      accepted: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      completed: { variant: 'default' as const, className: 'bg-blue-100 text-blue-800' }
    };
    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <ArrowRight className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric' 
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipper Dashboard</h1>
        <p className="text-gray-600">Manage your shipments and find truck space</p>
      </div>

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
            <Card className="border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.activeShipments}</div></CardContent>
            </Card>
            <Card className={stats.pendingRequests > 0 ? "border-orange-500 ring-1 ring-orange-500" : "border-orange-100"}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className={`h-4 w-4 ${stats.pendingRequests > 0 ? 'text-orange-600 animate-pulse' : 'text-yellow-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.pendingRequests > 0 ? 'text-orange-600' : ''}`}>
                  {stats.pendingRequests}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Shipments</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.completedShipments}</div></CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">₹{stats.totalSpent.toLocaleString()}</div></CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Find Shipments</h2>
          <Button 
            variant="ghost" 
            onClick={() => setShowFilters(!showFilters)} 
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-in slide-in-from-top duration-200">
            <div>
              <Label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">Origin State</Label>
              <select
                id="origin"
                value={filters.origin}
                onChange={(e) => setFilters({...filters, origin: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">Any</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">Destination State</Label>
              <select
                id="destination"
                value={filters.destination}
                onChange={(e) => setFilters({...filters, destination: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">Any</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="minWeight" className="block text-sm font-medium text-gray-700 mb-1">Min Capacity (Tonnes)</Label>
              <div className="flex gap-2">
                <Input
                  id="minWeight"
                  type="number"
                  placeholder="e.g. 5"
                  value={filters.minWeight}
                  onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                  className="text-sm"
                />
                <Button 
                  onClick={clearFilters} 
                  variant="outline"               
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-4 w-4 mr-2 text-blue-600" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/shipper/post-shipment" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Post New Shipment
                </Button>
              </Link>
              <Link to="/browse-trucks" className="block">
                <Button variant="outline" className="w-full border-blue-200 text-blue-700">
                  Browse Trucks
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria</p>
              <Button 
                onClick={clearFilters}                 
                className="bg-blue-600"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredShipments.map((shipment) => (
                <Card key={shipment.id} className="overflow-hidden border-blue-100 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {shipment.origin_city} <ArrowRight className="h-4 w-4 inline mx-1 text-gray-400" /> {shipment.destination_city}
                              </h3>
                              <p className="text-sm text-gray-600">{shipment.goods_description}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {shipment.weight_tonnes} Tonnes
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Ready Date</p>
                              <p className="font-medium">
                                {formatDate(shipment.departure_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                            <div>
                              <p className="text-gray-500 text-xs">Budget</p>
                              <p className="font-bold text-green-600">
                                ₹{shipment.budget_per_tonne.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-64 bg-gray-50 p-6 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col justify-center">
                        <div className="space-y-3">
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md"
                            onClick={() => openOfferDialog(shipment)}
                          >
                            Book Space
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Link to={`/shipper/shipments/${shipment.id}`} className="block">
                            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Space on {selectedShipment?.origin_city} → {selectedShipment?.destination_city}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Your Price per Tonne (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="price"
                  type="number" 
                  className="pl-10"
                  value={proposedPrice} 
                  onChange={(e) => setProposedPrice(e.target.value)}                 />
              </div>
              <p className="text-xs text-gray-500">Shipper's budget: ₹{selectedShipment?.budget_per_tonne}/t</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Input 
                id="message"
                value={message} 
                onChange={(e) => setMessage(e.target.value)}                 placeholder="e.g. I have a 12-wheeler available." 
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-bold text-blue-700">
                  ₹{((parseFloat(proposedPrice) || 0) * (selectedShipment?.weight_tonnes || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)} disabled={sendingOffer}>Cancel</Button>
            <Button 
              onClick={submitOffer} 
              className="bg-blue-600 hover:bg-blue-700"  
              disabled={sendingOffer || !proposedPrice}
            >
              {sendingOffer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />  
                  Sending...
                </>
              ) : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShipperDashboard;