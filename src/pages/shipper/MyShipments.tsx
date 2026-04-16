"use client";

import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Loader2, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

const MyShipments = () => {
  const { userProfile } = useAuth();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["my-shipments", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.id,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
        <Link to="/shipper/post-shipment">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Post Shipment
          </Button>
        </Link>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">You haven't posted any shipments yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipments.map((shipment: any) => (
                <Card key={shipment.id} className="border-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {shipment.origin_city} → {shipment.destination_city}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-1">
                      {shipment.goods_description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        shipment.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {shipment.status.toUpperCase()}
                      </span>
                      <div className="flex gap-3">
                        <Link 
                          to={`/shipper/shipments/${shipment.id}/edit`} 
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <Link 
                          to={`/shipper/shipments/${shipment.id}`} 
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          Details
                        </Link>
                      </div>
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

export default MyShipments;