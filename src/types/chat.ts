export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  request_id?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  user_type: 'trucker' | 'shipper';
}