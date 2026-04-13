"use client";

import React, { useEffect, useState } from 'react';
import { useWebSocket } from 'react-use-websocket';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, X, Package } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface ShipmentNotification {
  id: number;
  title: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
  recipientId?: string;
}

const ShipperDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<ShipmentNotification[]>([]);
  // Note: PlaceHolder URL as per previous implementation
  const { lastJsonMessage } = useWebSocket('wss://your-notification-service.com', {
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (lastJsonMessage && userProfile) {
      const data = lastJsonMessage as any;
      // Example logic: Only show notifications meant for this user
      if (data.type === 'shipment_notification' && data.recipientId === userProfile.id) {
        setNotifications(prev => [...prev, { ...data.payload, id: Date.now() }]);
      }
    }
  }, [lastJsonMessage, userProfile]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Shipment Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500">No new shipment notifications.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notifications.map(notif => (
            <Alert key={notif.id} className="relative border-blue-100 bg-blue-50/30">
              <Bell className="h-4 w-4 text-blue-600" />
              <AlertTitle className="font-bold">{notif.title}</AlertTitle>
              <AlertDescription>{notif.description}</AlertDescription>
              <button 
                onClick={() => removeNotification(notif.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShipperDashboard;