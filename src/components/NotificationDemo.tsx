import React, { useState } from 'react';
import { Button } from '@shadcn/ui';
import { Notification } from '@shadcn/ui';

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
  };

  return (
    <div className="p-4 space-y-4">
      <Button onClick={addNotification}>Send Booking Request</Button>
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

export default NotificationDemo;