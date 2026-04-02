"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface QuickStatsProps {
  userType: 'trucker' | 'shipper';
  stats: {
    activeItems: number;
    pendingItems: number;
    completedItems: number;
    totalAmount: number;
    upcomingItems?: any[];
  };
}

const QuickStats: React.FC<QuickStatsProps> = ({ userType, stats }) => {
  const isTrucker = userType === 'trucker';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {isTrucker ? 'Active Trips' : 'Active Shipments'}
          </CardTitle>
          {isTrucker ? (
            <Truck className="h-4 w-4 text-orange-600" />
          ) : (
            <Package className="h-4 w-4 text-blue-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeItems}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingItems}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {isTrucker ? 'Completed Trips' : 'Completed Shipments'}
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedItems}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {isTrucker ? 'Total Earnings' : 'Total Spent'}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₹{stats.totalAmount.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;