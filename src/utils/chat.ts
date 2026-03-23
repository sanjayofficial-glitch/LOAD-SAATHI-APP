import { supabase } from '@/lib/supabaseClient';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  request_id?: string;
}

export const sendMessage = async (recipientId: string, content: string, requestId?: string) => {
  const { data, error } = await supabase.from('messages').insert({
    sender_id: (await supabase.auth.getUser()).data.user?.id,
    recipient_id: recipientId,
    content: content,
    request_id: requestId
  });

  if (error) throw error;
  return data;
};

export const fetchMessages = async (requestId?: string) => {
  let query = supabase.from('messages').select('*');
  
  if (requestId) {
    query = query.eq('request_id', requestId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Message[];
};

export const subscribeToMessages = (callback: (payload: any) => void) => {
  return supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, callback)
    .subscribe();
};