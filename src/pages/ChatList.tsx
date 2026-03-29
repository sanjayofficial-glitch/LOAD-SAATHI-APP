"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User, ArrowRight, Loader2, Clock } from 'lucide-react';
import { showError } from '@/utils/toast';

interface ChatPreview {
  requestId: string;
  otherUser: {
    id: string;
    full_name: string;
    user_type: string;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  };
  tripInfo: {
    origin: string;
    destination: string;
  };
}

const ChatList = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const fetchChats = async () => {
      try {
        // 1. Fetch all requests where the user is involved
        // If trucker, find requests for their trips. If shipper, find their requests.
        let query = supabase.from('requests').select('*, trip:trips(*, trucker:users(*)), shipper:users(*)');
        
        if (userProfile.user_type === 'trucker') {
          // This is tricky without a direct join on trips.trucker_id
          // We'll fetch the trucker's trips first
          const { data: myTrips } = await supabase.from('trips').select('id').eq('trucker_id', userProfile.id);
          const tripIds = myTrips?.map(t => t.id) || [];
          if (tripIds.length === 0) {
            setChats([]);
            setLoading(false);
            return;
          }
          query = query.in('trip_id', tripIds);
        } else {
          query = query.eq('shipper_id', userProfile.id);
        }

        const { data: requests, error: reqError } = await query.order('created_at', { ascending: false });
        if (reqError) throw reqError;

        if (!requests || requests.length === 0) {
          setChats([]);
          setLoading(false);
          return;
        }

        // 2. For each request, fetch the last message
        const chatPreviews: ChatPreview[] = await Promise.all(
          requests.map(async (req) => {
            const { data: messages } = await supabase
              .from('messages')
              .select('*')
              .eq('request_id', req.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const isTrucker = userProfile.user_type === 'trucker';
            const otherUser = isTrucker ? req.shipper : req.trip.trucker;

            return {
              requestId: req.id,
              otherUser: {
                id: otherUser.id,
                full_name: otherUser.full_name,
                user_type: otherUser.user_type
              },
              lastMessage: messages?.[0],
              tripInfo: {
                origin: req.trip.origin_city,
                destination: req.trip.destination_city
              }
            };
          })
        );

        // Sort by last message date or request date
        chatPreviews.sort((a, b) => {
          const dateA = a.lastMessage?.created_at || '0';
          const dateB = b.lastMessage?.created_at || '0';
          return dateB.localeCompare(dateA);
        });

        setChats(chatPreviews);
      } catch (err: any) {
        console.error('[ChatList] Error:', err);
        showError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500">Manage your conversations with shippers and truckers</p>
      </div>

      {chats.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No messages yet</h3>
            <p className="text-gray-500 mb-6">Start a conversation by booking a trip or accepting a request.</p>
            <Button 
              onClick={() => navigate(userProfile?.user_type === 'trucker' ? '/trucker/dashboard' : '/browse-trucks')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => {
            const unread = chat.lastMessage && !chat.lastMessage.is_read && chat.lastMessage.sender_id !== userProfile?.id;
            
            return (
              <Card 
                key={chat.requestId} 
                className={`cursor-pointer hover:shadow-md transition-all border-orange-100 ${unread ? 'bg-orange-50/30 border-orange-200' : ''}`}
                onClick={() => navigate(`/chat/${chat.requestId}`)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200 flex-shrink-0">
                          <User className="h-6 w-6 text-orange-600" />
                        </div>
                        {unread && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 rounded-full border-2 border-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold truncate ${unread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {chat.otherUser.full_name}
                          </h3>
                          {chat.lastMessage && (
                            <span className="text-[10px] text-gray-400 font-medium flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">
                          {chat.tripInfo.origin} → {chat.tripInfo.destination}
                        </p>
                        
                        <p className={`text-sm truncate ${unread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                          {chat.lastMessage ? (
                            chat.lastMessage.sender_id === userProfile?.id ? `You: ${chat.lastMessage.content}` : chat.lastMessage.content
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;