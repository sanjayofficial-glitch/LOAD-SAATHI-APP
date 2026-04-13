import React, { useEffect, useState } from 'react';
import { Notification } from '@shadcn/ui';
import { useWebSocket } from 'react-use-websocket';

interface ShipmentNotification {
  id: number;
  title: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
  recipientTruckerId?: string;
}

const ShipperDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<ShipmentNotification[]>([]);
  const { ws } = useWebSocket('wss://your-notification-service.com');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'shipment_notification' && data.recipientTruckerId === 'raju') {
          setNotifications(prev => [...prev, data.payload]);
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Shipment Notifications</h2>
      {notifications.map(notif => (
        <Notification
          key={notif.id}
          title={notif.title}
          description={notif.description}
          status={notif.status}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
        />
      ))}
    </div>
  );
};

export default ShipperDashboard;