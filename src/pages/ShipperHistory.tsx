"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { showError, showSuccess } from "@/utils/toast";

const ShipperHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    activityType: "",
    status: "",
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query the shipper_history view  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["shipperHistory", filters.activityType, filters.status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipper_history")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Filter activities based on current filters
  const filteredActivities = useCallback(() => {
    if (!activities) return [];
    return activities.filter((activity) => {
      if (filters.activityType && activity.activity_type !== filters.activityType)
        return false;
      if (filters.status && activity.status !== filters.status) return false;
      return true;
    });
  }, [activities, filters]);

  const applyFilters = () => {
    // Trigger re-query with new filters
  };

  // Handle item click
  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="text-orange-600 animate-spin">Loading history...</span>
    </div>
  );

  // Modal for full details
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with filters */}
      <div className="container mx-auto px-4 py-6 border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            My Activity History
          </h1>
          <div className="flex items-center space-x-4">
            <Badge
              variant="default"
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {user?.user_type === "shipper"
                ? "Shipper"
                : "Unknown"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Activity Type Filter */}
          <div className="border rounded-lg p-3">
            <Label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type            </Label>
            <Input
              id="activityType"
              type="text"
              placeholder="All Types"
              className="w-full p-2 border border-gray-200 rounded-md text-sm"
              value={filters.activityType}
              onChange={(e) => setFilters((f) => ({ ...f, activityType: e.target.value }))}
            />
          </div>

          {/* Status Filter */}
          <div className="border rounded-lg p-3">
            <Label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </Label>
            <Input
              id="statusFilter"
              type="text"
              placeholder="All Statuses"
              className="w-full p-2 border border-gray-200 rounded-md text-sm"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-4">
          {filteredActivities().length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No activity history found</p>
            </div>
          ) : (
            filteredActivities().map((activity) => (
              <Card
                key={activity.id}
                className="border border-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleItemClick(activity)}
              >
                <CardContent className="p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200">
                        {renderActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 font-medium">
                          {activity.activity_type.replace("_", " ")}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.counterparty_name || "N/A"}
                      </span>
                      <Badge
                        variant={getBadgeVariant(activity.status)}
                        className="ml-2"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function renderActivityIcon(type: string) {
  switch (type) {
    case "shipment":
      return <Package className="h-6 w-6 text-blue-600" />;
    case "outgoing_request":
      return <Truck className="h-6 w-6 text-orange-600" />;
    case "incoming_shipment_request":
      return <Package className="h-6 w-6 text-purple-600" />;
    case "completed_trip":
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    default:
      return <RefreshCw className="h-6 w-6 text-gray-500" />;
  }
}

function getBadgeVariant(status: string) {
  switch (status) {
    case "completed":
      return "success";
    case "accepted":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
}

export default ShipperHistory;