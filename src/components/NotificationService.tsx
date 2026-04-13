import React, { useEffect, useState } from 'react';
import { Notification } from '@shadcn/ui';
import { useWebSocket } from 'react-use-websocket';

const NotificationService = () => {
  const [notifications, setNotifications] = useState([]);
  const { ws } = useWebSocket('wss://your-notification-service.com');

  useEffect(() => {
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [...prev, data]);
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="p-4 space-y-4">
      {notifications.map((notif, index) => (
        <Notification
          key={index}
          title={notif.title}
          description={notif.description}
          status={notif.status}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
        />
      )}
    </div>
  );
};

export default NotificationService;