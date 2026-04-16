"use client";

import React, { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, X } from "lucide-react";

interface NotificationData {
  id: string;
  title: string;
  description: string;
  status?: 'info' | 'success' | 'warning' | 'error';
}

const NotificationService: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Replace with your actual WebSocket URL if needed
  const socketUrl = 'wss://echo.websocket.org'; 

  const { lastJsonMessage } = useWebSocket(socketUrl, {
    onOpen: () => console.log('Notification WebSocket connected'),
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (lastJsonMessage) {
      const newNotif = lastJsonMessage as NotificationData;
      setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    }
  }, [lastJsonMessage]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-4">
      {notifications.map((notif) => (
        <Alert key={notif.id} className="relative bg-white shadow-lg border-orange-100 animate-in slide-in-from-right duration-300">
          <Bell className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-sm font-bold">{notif.title}</AlertTitle>
          <AlertDescription className="text-xs text-gray-600">
            {notif.description}
          </AlertDescription>
          <button
            onClick={() => removeNotification(notif.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </button>
        </Alert>
      ))}
    </div>
  );
};

export default NotificationService;