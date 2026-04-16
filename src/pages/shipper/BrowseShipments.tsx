"use client";

import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const BrowseShipments = () => {
  const { userProfile } = useAuth();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["browse-shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Browse Public Shipments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No public shipments found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipments.map((shipment: any) => (
                <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {shipment.origin_city} → {shipment.destination_city}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {shipment.goods_description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {shipment.weight_tonnes}t
                      </span>
                      <Link 
                        to={`/shipper/shipments/${shipment.id}`} 
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrowseShipments;