"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, X } from "lucide-react";
import { showSuccess } from '@/utils/toast';

interface Notif {
  id: number;
  title: string;
  description: string;
  status?: 'info' | 'success' | 'warning' | 'error';
}

const NotificationDemo: React.FC = () => {
  const [notifications, setNotifications] = useState<Notif[]>([]);

  const addNotification = () => {
    const newNotif: Notif = {
      id: Date.now(),
      title: 'Booking Request Sent',
      description: 'Your shipment booking request has been sent to the shipper.',
      status: 'info',
    };
    setNotifications(prev => [...prev, newNotif]);
    showSuccess('Booking request sent successfully!');
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-4 space-y-4">
      <Button onClick={addNotification} className="bg-orange-600 hover:bg-orange-700">
        Send Booking Request
      </Button>
      
      <div className="space-y-2">
        {notifications.map(notif => (
          <Alert key={notif.id} className="relative border-blue-100">
            <Bell className="h-4 w-4 text-blue-600" />
            <AlertTitle>{notif.title}</AlertTitle>
            <AlertDescription>{notif.description}</AlertDescription>
            <button 
              onClick={() => removeNotification(notif.id)}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default NotificationDemo;