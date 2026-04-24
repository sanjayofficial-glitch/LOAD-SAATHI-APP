"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Bell, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) return;
      
      const supabaseClient = createClerkSupabaseClient(supabaseToken);
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('[NotificationBell] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getToken]);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
          showSuccess(newNotif.message); // Show popup toast
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, fetchNotifications]);

  const markAllAsRead = async () => {
    if (unreadCount === 0 || !userProfile?.id) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) return;
      const supabaseClient = createClerkSupabaseClient(supabaseToken);
      await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && markAllAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} New</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} className="p-3 cursor-default focus:bg-gray-50">
                <div className="flex gap-3">
                  <div className={`mt-0.5 p-1 rounded-full h-fit ${notif.is_read ? 'bg-gray-100' : 'bg-orange-100'}`}>
                    {notif.message.includes('Accepted') ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-orange-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;