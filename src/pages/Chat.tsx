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

  useEffect(() => {
    if (!requestId || !userProfile) return;

    let channel: any;

    const initChat = async () => {
      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('Authentication failed');
        
        const supabaseClient = createClerkSupabaseClient(supabaseToken);

        // Try both request types to find the chat partner
        const [reqRes, sReqRes] = await Promise.all([
          supabaseClient.from('requests').select('*, trip:trips(*, trucker:users!trips_trucker_id_fkey(*)), shipper:users!requests_shipper_id_fkey(*)').eq('id', requestId).maybeSingle(),
          supabaseClient.from('shipment_requests').select('*, shipment:shipments(*, shipper:users!shipments_shipper_id_fkey(*)), trucker:users!shipment_requests_trucker_id_fkey(*)').eq('id', requestId).maybeSingle()
        ]);

        let otherUser = null;
        if (reqRes.data) {
          otherUser = userProfile.user_type === 'trucker' ? reqRes.data.shipper : reqRes.data.trip?.trucker;
        } else if (sReqRes.data) {
          otherUser = userProfile.user_type === 'trucker' ? sReqRes.data.shipment?.shipper : sReqRes.data.trucker;
        }

        if (!otherUser) throw new Error('Chat partner not found');
        setRecipient(otherUser);

        const initialMessages = await fetchMessages(requestId, () => getToken({ template: 'supabase' }));
        setMessages(initialMessages);
        markMessagesAsRead(requestId, userProfile.id, () => getToken({ template: 'supabase' }));

        channel = subscribeToMessages(requestId, (msg) => {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          if (msg.recipient_id === userProfile.id) markMessagesAsRead(requestId, userProfile.id, () => getToken({ template: 'supabase' }));
        });

        setLoading(false);
      } catch (err: any) {
        showError(err.message || 'Failed to load chat');
        navigate(-1);
      }
    };

    initChat();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [requestId, userProfile, navigate, getToken]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !requestId || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const sentMsg = await sendMessage({ recipientId: recipient.id, content: newMessage, requestId, getToken: () => getToken({ template: 'supabase' }), userId: userProfile!.id });
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
    } catch (err) {
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-orange-600" /></div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl h-[calc(100vh-140px)] flex flex-col">
      <Card className="border-orange-100 shadow-lg flex-grow flex flex-col overflow-hidden">
        <CardHeader className="border-b bg-white py-4 px-6 flex flex-row items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><UserIcon className="h-5 w-5 text-orange-600" /></div>
            <div>
              <CardTitle className="text-lg font-bold">{recipient?.full_name}</CardTitle>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><p className="text-xs text-gray-500">Online</p></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0 flex flex-col bg-gray-50/30">
          <ScrollArea className="flex-grow px-6 py-6">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === userProfile?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 text-sm max-w-[80%] ${msg.sender_id === userProfile?.id ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
            <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={sending} />
            <Button type="submit" disabled={sending || !newMessage.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;