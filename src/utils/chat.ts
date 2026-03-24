import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/types/chat';

export interface MessagePayload {
  recipientId: string;
  content: string;
  requestId?: string;
}

export const sendMessage = async (payload: MessagePayload): Promise<Message> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const senderId = userData?.user?.id;

  if (userError || !senderId) {
    throw new Error('User not authenticated');
  }

  const { data: messageData, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      recipient_id: payload.recipientId,
      content: payload.content,
      request_id: payload.requestId,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to send message');
  }

  return messageData as Message;
};

export const fetchMessages = async (requestId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch messages');
  }

  return data || [];
};

export const markMessagesAsRead = async (messageIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .in('id', messageIds);

  if (error) {
    throw new Error('Failed to mark messages as read');
  }
};

export const subscribeToNewMessages = (
  requestId: string,
  onNewMessage: (message: Message) => void
) => {
  const channel = supabase
    .channel(`messages:${requestId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `request_id=eq.${requestId}`,
    }, (payload) => {
      const newMessage = payload.new as Message;
      onNewMessage(newMessage);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const unsubscribeFromMessages = (requestId: string): void => {
  supabase.removeChannel(supabase.channel(`messages:${requestId}`));
};