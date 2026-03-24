import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/types/chat';
import { sendMessage, fetchMessages, subscribeToNewMessages, markMessagesAsRead } from '@/utils/chat';
import { Button, Input, Textarea, Avatar, AvatarImage, AvatarFallback, CheckCircle, XCircle, Loader2, ArrowRight, ArrowLeft, Check } from '@/components/ui';
import { format } from 'date-fns';

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestId || !userProfile?.id) return;

    const loadMessages = async () => {
      try {
        const { data: initialMessages } = await fetchMessages(requestId);
        setMessages(initialMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [requestId, userProfile?.id]);

  useEffect(() => {
    if (!requestId || !userProfile?.id) return;

    const cleanup = subscribeToNewMessages(requestId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    });

    return () => {
      cleanup();
    };
  }, [requestId, userProfile?.id]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !requestId || !userProfile?.id) return;

    try {
      const { data: sentMessage } = await sendMessage({
        recipientId: userProfile.user_type === 'trucker' ? request?.shipper_id : request?.trucker_id,
        content: newMessage.trim(),
        requestId,
      });

      setNewMessage('');
      scrollToBottom();
      setIsSending(false);
    } catch (error) {
      console.error("Error sending message:", error);
      showError("Failed to send message");
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  const handleTyping = () => {
    setShowTyping(true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => setShowTyping(false), 3000);
  };

  const handleTypingEnd = () => {
    clearTimeout(typingTimeoutRef.current);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} alt={userProfile?.full_name} />
            <AvatarFallback>{userProfile?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold">{userProfile?.full_name || "Unknown User"}</h2>
            <p className="text-sm text-gray-500">{request?.shipper?.full_name || "Shipper"}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start ${msg.sender_id === userProfile?.id ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`max-w-[70%] ${msg.sender_id === userProfile?.id ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={msg.sender_avatar || "/placeholder.svg"} alt={msg.sender_name} />
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-medium">{msg.sender_name}</p>
                    <p className="text-sm text-gray-500">{formatMessageTime(msg.created_at)}</p>
                  </div>
                </div>
                <p className="mt-1">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center p-4 border-t">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} alt={userProfile?.full_name} />
          </Avatar>
          <div>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 resize-none border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSendMessage}
          className="ml-auto"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;