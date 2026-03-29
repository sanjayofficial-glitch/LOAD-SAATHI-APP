"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, ArrowRight, Loader2, Clock } from 'lucide-react';
import { showError } from '@/utils/toast';

interface ChatConversation {
  id: string;
  request_id: string;
  other_user: {
    id: string;
    full_name: string;
    user_type: string;
  };
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const ChatList = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    const fetchConversations = async () => {
      try {
        // Get all messages where user is sender or recipient
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            *,
            request:requests(
              id,
              trip:trips(
                id,
                origin_city,
                destination_city
              ),
              shipper:users!requests_shipper_id_fkey(
                id,
                full_name,
                user_type
              ),
              trip:trip_id
            )
          `)
          .or(`sender_id.eq.${userProfile.id},recipient_id.eq.${userProfile.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by request_id to get conversations
        const conversationMap = new Map<string, ChatConversation>();
        
        messages?.forEach(msg => {
          const requestId = msg.request_id;
          if (!requestId) return;

          const existing = conversationMap.get(requestId);
          const isFromMe = msg.sender_id === userProfile.id;
          const otherUserId = isFromMe ? msg.recipient_id : msg.sender_id;
          
          // Get other user info from request
          const request = msg.request as any;
          const otherUser = request?.shipper || { id: otherUserId, full_name: 'Unknown', user_type: '' };

          if (!existing) {
            conversationMap.set(requestId, {
              id: requestId,
              request_id: requestId,
              other_user: otherUser,
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: !isFromMe && !msg.is_read ? 1 : 0
            });
          } else {
            // Update last message if this is newer
            if (new Date(msg.created_at) > new Date(existing.last_message_time)) {
              existing.last_message = msg.content;
              existing.last_message_time = msg.created_at;
            }
            // Increment unread if message is from other user and unread
            if (!isFromMe && !msg.is_read) {
              existing.unread_count += 1;
            }
          }
        });

        const conversationsList = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

        setConversations(conversationsList);
      } catch (error: any) {
        console.error('[ChatList] Error:', error);
        showError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userProfile]);

  const getRequestTitle = (conv: ChatConversation) => {
    // Try to get trip info from the request
    return `${conv.other_user.full_name}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Your conversations with shippers and truckers</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="border-orange-100">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-6">Start a conversation by booking a trip or accepting a request.</p>
              <Button 
                onClick={() => navigate(userProfile?.user_type === 'trucker' ? '/trucker/dashboard' : '/browse-trucks')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conv) => (
            <Card 
              key={conv.id} 
              className="cursor-pointer hover:shadow-md transition-shadow border-orange-100"
              onClick={() => navigate(`/chat/${conv.request_id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                      <User className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate">
                          {getRequestTitle(conv)}
                        </h3>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(conv.last_message_time).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-orange-600 text-white ml-2">
                      {conv.unread_count}
                    </Badge>
                  )}
                  <ArrowRight className="h-5 w-5 text-gray-400 ml-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;