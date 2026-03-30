"use client";

import { toast } from "sonner";

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
 * @param payload Recipient ID, message content, and optional request ID.
 * @returns The newly created message object.
 */
export const sendMessage = async (payload: {
  recipientId: string;
  content: string;
  requestId?: string;
}): Promise<Message> => {
  // Debug logging - will appear in browser console
  console.debug('[sendMessage] Called with payload:', payload);

  const { recipientId, content, requestId } = payload;

  // Basic validation before hitting the database
  if (!recipientId || !content) {
    throw new Error('Recipient ID and message content are required');
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[sendMessage] User not authenticated');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content,
        request_id: requestId,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[sendMessage] Supabase insert error:', error);
      throw new Error(error.message || 'Failed to send message');
    }

    console.debug('[sendMessage] Successfully inserted message:', data);
    return data as Message;
  } catch (err: any) {
    console.error('[sendMessage] Unexpected error:', err);
    throw err; // Re-throw to let the caller handle it  }
};

export const fetchMessages = async (requestId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[fetchMessages] Supabase query error:', error);
      throw new Error('Failed to fetch messages');
    }

    console.debug('[fetchMessages] Retrieved messages:', data);
    return data || [];
  } catch (err: any) {
    console.error('[fetchMessages] Unexpected error:', err);
    throw err;
  }
};

export const markMessagesAsRead = async (requestId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('request_id', requestId)
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[markMessagesAsRead] Update error:', error);
    }
  } catch (err: any) {
    console.error('[markMessagesAsRead] Unexpected error:', err);
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
        console.debug('[subscribeToMessages] New message received:', payload.new);
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe((status) => {
      console.debug(`[subscribeToMessages] Subscription status for ${requestId}:`, status);
    });

  return channel;
};