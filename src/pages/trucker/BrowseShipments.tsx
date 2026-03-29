"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Shipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Search, 
  ArrowRight,
  Loader2,
  Filter
} from 'lucide-react';
import { showError } from '@/utils/toast';

const BrowseShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, shipper:users(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        showError('Failed to load shipments');
      } else if (data) {
        setShipments(data as unknown as Shipment[]);
      }
      setLoading(false);
    };

    fetchShipments();
  }, []);

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => 
      (s.origin_city.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.destination_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
       s.goods_description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterOrigin === '' || s.origin_city === filterOrigin)
    );
  }, [shipments, searchTerm, filterOrigin]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Shipments</h1>
        <p className="text-gray-600">Find goods that need transport on your routes</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by city or goods..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="md:w-auto">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      {filteredShipments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No shipments found</h3>
          <p className="text-gray-500">Try adjusting your search or check back later</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredShipments.map((shipment) => (
            <Card key={shipment.id} className="overflow-hidden border-orange-100 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xl font-bold text-gray-900">
                        {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400" /> {shipment.destination_city}
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {shipment.weight_tonnes} Tonnes
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                        Ready by: {new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center font-bold text-green-600">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        Budget: {shipment.budget_per_tonne.toLocaleString()} /t
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Goods Description</p>
                      <p className="text-sm text-gray-700">{shipment.goods_description}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <Button className="bg-orange-600 hover:bg-orange-700 w-full">
                      Contact Shipper
                    </Button>
                    <p className="text-[10px] text-center text-gray-400">
                      Posted by {shipment.shipper?.full_name || 'Verified Shipper'}
                    </p>
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

export default BrowseShipments;