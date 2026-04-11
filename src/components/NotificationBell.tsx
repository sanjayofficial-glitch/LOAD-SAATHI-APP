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
import { supabase } from '@/lib/supabaseClient';
import { Notification } from '@/types';

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
      
      const { data } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('[NotificationBell] Error fetching notifications:', err);
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, getToken]);

  const markAllAsRead = async () => {
    if (unreadCount === 0 || !userProfile?.id) return;
    
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) return;
      
      const supabaseClient = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabaseClient
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false);

      if (!error) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('[NotificationBell] Error marking notifications as read:', err);
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-orange-50 transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 animate-in fade-in slide-in-from-top-2">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} className="p-3 cursor-default focus:bg-gray-50">
                <div className="flex gap-3">
                  <div className={`mt-0.5 p-1 rounded-full h-fit ${notif.is_read ? 'bg-gray-100' : 'bg-orange-100'}`}>
                    {notif.message.toLowerCase().includes('accepted') ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                    )} 
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className={`text-sm leading-tight ${notif.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
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