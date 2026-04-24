"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Message } from '@/types/chat';
import { fetchMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/utils/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, User as UserIcon } from 'lucide-react';
import { showError } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState<{ id: string; full_name: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!requestId || !userProfile) return;

    let channel: any;

    const initChat = async () => {
      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        
        const supabaseClient = createClerkSupabaseClient(supabaseToken);

        // 1. Try to fetch from 'requests' table (Shipper booking a Trucker's trip)
        const { data: request, error: reqError } = await supabaseClient
          .from('requests')
          .select('*, trip:trips(*, trucker:users!trips_trucker_id_fkey(*)), shipper:users!requests_shipper_id_fkey(*)')
          .eq('id', requestId)
          .maybeSingle();

        let otherUser = null;

        if (request) {
          // If I am the trucker, the other user is the shipper. If I am the shipper, the other user is the trucker.
          otherUser = userProfile.user_type === 'trucker' ? request.shipper : request.trip?.trucker;
        } else {
          // 2. Try to fetch from 'shipment_requests' table (Trucker offering on a Shipper's load)
          const { data: sRequest, error: sReqError } = await supabaseClient
            .from('shipment_requests')
            .select('*, shipment:shipments(*, shipper:users!shipments_shipper_id_fkey(*)), trucker:users!shipment_requests_trucker_id_fkey(*)')
            .eq('id', requestId)
            .maybeSingle();
          
          if (sRequest) {
            otherUser = userProfile.user_type === 'trucker' ? sRequest.shipment?.shipper : sRequest.trucker;
          }
        }

        if (!otherUser) {
          console.error('[ChatPage] Could not find chat partner for request:', requestId);
          throw new Error('Chat session not found or you do not have access');
        }

        setRecipient(otherUser);

        // 3. Fetch existing messages
        const initialMessages = await fetchMessages(requestId, () => getToken({ template: 'supabase' }));
        setMessages(initialMessages);
        
        // 4. Mark messages as read
        markMessagesAsRead(requestId, userProfile.id, () => getToken({ template: 'supabase' }));

        // 5. Subscribe to real-time updates
        channel = subscribeToMessages(requestId, (msg) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          if (msg.recipient_id === userProfile.id) {
            markMessagesAsRead(requestId, userProfile.id, () => getToken({ template: 'supabase' }));
          }
        });

        setLoading(false);
      } catch (err: any) {
        console.error('[ChatPage] Initialization error:', err);
        showError(err.message || 'Failed to load chat session');
        navigate(-1);
      }
    };

    initChat();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [requestId, userProfile, navigate, getToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !requestId) {
      showError('Chat session not ready yet.');
      return;
    }
    
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const sentMsg = await sendMessage({
        recipientId: recipient.id,
        content: content,
        requestId: requestId,
        getToken: () => getToken({ template: 'supabase' }),
        userId: userProfile.id,
      });
      
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      
      setNewMessage('');
    } catch (err: any) {
      showError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-500">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl h-[calc(100vh-140px)] flex flex-col">
      <Card className="border-orange-100 shadow-lg">
        <CardHeader className="border-b bg-white py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost"                 
                size="icon" 
                onClick={() => navigate(-1)}
                className="hover:bg-orange-50 text-gray-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                  <UserIcon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {recipient?.full_name || 'Chat Partner'}
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xs text-gray-500 font-medium">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden p-0 flex flex-col bg-gray-50/30">
          <ScrollArea className="flex-grow px-6 py-6">
            <div className="space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-orange-300" />
                  </div>
                  <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender_id === userProfile?.id;
                  const showDate = index === 0 || 
                    new Date(messages[index-1]?.created_at).toDateString() !== new Date(msg.created_at).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMe
                                ? 'bg-orange-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                            }`}
                          >
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                          <span className={`text-[10px] mt-1.5 font-medium text-gray-400 px-1`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && msg.is_read && <span className="ml-1 text-blue-500">Read</span>}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
              <div className="flex-grow relative">
                <Input                  
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="pr-10 py-6 rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-500"
                  disabled={sending}
                />
              </div>
              <Button                 
                type="submit" 
                size="icon"
                className="h-12 w-12 rounded-xl bg-orange-600 hover:bg-orange-700 shadow-md transition-all hover:shadow-lg active:scale-95"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;