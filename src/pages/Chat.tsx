"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/types/chat';
import { fetchMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/utils/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, User as UserIcon, Check, CheckCheck } from 'lucide-react';
import { showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState<{ id: string; full_name: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!requestId || !userProfile) return;

    let channel: any;

    const initChat = async () => {
      try {
        // 1. Fetch request details to identify the other participant
        const { data: request, error: reqError } = await supabase
          .from('requests')
          .select(`
            *,
            trip:trips(*),
            shipper:users!requests_shipper_id_fkey(*),
            trip:trip_id
          `)
          .eq('id', requestId)
          .single();

        if (reqError || !request) throw new Error('Request not found');

        const isTrucker = userProfile.user_type === 'trucker';
        const otherUser = isTrucker ? request.shipper : request.trip.trucker;
        setRecipient(otherUser);

        // 2. Fetch existing messages
        const initialMessages = await fetchMessages(requestId);
        setMessages(initialMessages);
        
        // Count unread messages
        const unread = initialMessages.filter(m => 
          m.recipient_id === userProfile.id && !m.is_read
        ).length;
        setUnreadCount(unread);
        
        // 3. Mark messages as read
        await markMessagesAsRead(requestId, userProfile.id);

        // 4. Subscribe to real-time updates
        channel = subscribeToMessages(requestId, (msg) => {
          setMessages((prev) => {
            // Prevent duplicate messages
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          // Mark incoming message as read if it's for us
          if (msg.recipient_id === userProfile.id && !msg.is_read) {
            markMessagesAsRead(requestId, userProfile.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        });

        setLoading(false);
      } catch (err: any) {
        console.error('[ChatPage] Initialization error:', err);
        showError('Failed to load chat session');
        navigate(-1);
      }
    };

    initChat();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [requestId, userProfile, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !requestId) {
      showError('Chat session not ready yet. Please wait a moment.');
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
      });
      
      // Optimistically add message if not already added by subscription
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      
      setNewMessage('');
    } catch (err: any) {
      console.error('[ChatPage] Error sending message:', err);
      showError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_id !== userProfile?.id) return null;
    return message.is_read ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3 text-gray-400" />;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-140px] flex flex-col">
      <Card className="border-orange-100 shadow-lg flex flex-col h-full">
        <CardHeader className="border-b bg-white py-4 px-6 flex-shrink-0">
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
                <Avatar className="h-10 w-10 border-2 border-orange-100">
                  <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                    {recipient?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {recipient?.full_name || 'Chat Partner'}
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-xs text-gray-500 font-medium">Online</p>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                        {unreadCount} unread
                      </Badge>
                    )}
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
                          <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className={`text-[10px] font-medium text-gray-400 px-1`}>
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isMe && getMessageStatus(msg)}
                          </div>
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