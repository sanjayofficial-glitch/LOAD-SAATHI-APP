import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId?: string | number) => {
  toast.dismiss(toastId);
};

/**
 * Send a new message in a chat conversation.
 */
export const sendMessage = async (payload: {
  recipientId: string;
  content: string;
  requestId?: string;
}): Promise<Message> => {
  const { recipientId, content, requestId } = payload;

  if (!recipientId || !content) {
    throw new Error('Recipient ID and message content are required');
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated. Please log in again.');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim(),
        request_id: requestId,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to send message');
    }

    return data as Message;
  } catch (err: any) {
    console.error('[sendMessage] Error:', err);
    throw err;
  }
};

/**
 * Fetch all messages for a specific request.
 */
export const fetchMessages = async (requestId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch messages');
    }

    return (data || []) as Message[];
  } catch (err: any) {
    console.error('[fetchMessages] Error:', err);
    throw err;
  }
};

/**
 * Mark messages as read for a specific user in a chat.
 */
export const markMessagesAsRead = async (requestId: string, userId: string): Promise<void> => {
  try {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('request_id', requestId)
      .eq('recipient_id', userId)
      .eq('is_read', false);
  } catch (err: any) {
    console.error('[markMessagesAsRead] Error:', err);
  }
};

/**
 * Subscribe to real-time message updates.
 */
export const subscribeToMessages = (
  requestId: string,
  onNewMessage: (message: Message) => void,
  _channel: any = undefined,
  _options?: any
): any => {
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
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  return channel;
};