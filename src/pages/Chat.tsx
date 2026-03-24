"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/types/chat';
import { fetchMessages, sendMessage, subscribeToNewMessages } from '@/utils/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';
import { showError } from '@/utils/toast';

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState<{ id: string; full_name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestId || !userProfile) return;

    const initChat = async () => {
      try {
        // Fetch request details to find the other participant
        const { data: request, error: reqError } = await supabase
          .from('requests')
          .select('*, trip:trips(*, trucker:users(*)), shipper:users(*)')
          .eq('id', requestId)
          .single();

        if (reqError || !request) throw new Error('Request not found');

        // Determine recipient
        const isTrucker = userProfile.user_type === 'trucker';
        const otherUser = isTrucker ? request.shipper : request.trip.trucker;
        setRecipient(otherUser);

        // Fetch existing messages
        const initialMessages = await fetchMessages(requestId);
        setMessages(initialMessages);
        
        // Subscribe to new messages
        const unsubscribe = subscribeToNewMessages(requestId, (msg) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });

        setLoading(false);
        return unsubscribe;
      } catch (err) {
        showError('Failed to load chat');
        navigate(-1);
      }
    };

    const unsubscribePromise = initChat();
    return () => {
      unsubscribePromise.then(unsub => unsub?.());
    };
  }, [requestId, userProfile, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !recipient || !requestId || sending) return;

    setSending(true);
    try {
      await sendMessage({
        recipientId: recipient.id,
        content: newMessage.trim(),
        requestId: requestId
      });
      setNewMessage('');
    } catch (err) {
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl h-[calc(100vh-120px)] flex flex-col">
      <Card className="flex-grow flex flex-col overflow-hidden border-orange-100 shadow-lg">
        <CardHeader className="border-b bg-orange-50/50 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{recipient?.full_name}</CardTitle>
                <p className="text-xs text-gray-500">Direct Message</p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden p-0 flex flex-col">
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === userProfile?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMe
                          ? 'bg-orange-600 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-900 rounded-tl-none'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow"
                disabled={sending}
              />
              <Button 
                type="submit" 
                className="bg-orange-600 hover:bg-orange-700"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;