"use client";

import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/types/chat';

export interface MessagePayload {
  recipientId: string;
  content: string;
  requestId?: string;
}

export const sendMessage = async (payload: MessagePayload): Promise<Message> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: payload.recipientId,
      content: payload.content,
      request_id: payload.requestId,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[ChatUtil] Error sending message:', error);
    throw new Error(error.message || 'Failed to send message');
  }

  return data as Message;
};

export const fetchMessages = async (requestId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ChatUtil] Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }

  return data || [];
};

export const markMessagesAsRead = async (requestId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('request_id', requestId)
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[ChatUtil] Error marking messages as read:', error);
  }
};

export const subscribeToMessages = (
  requestId: string,
  onNewMessage: (message: Message) => void
) => {
  const channel = supabase
    .channel(`chat:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`,
      },
      (payload) => {
        console.log('[ChatUtil] New message received via Realtime:', payload.new);
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe((status) => {
      console.log(`[ChatUtil] Subscription status for ${requestId}:`, status);
    });

  return channel;
};