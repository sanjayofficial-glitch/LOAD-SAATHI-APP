"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, Phone, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { showSuccess, showError } from '@/utils/toast';

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<Array<any>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [request, setRequest] = useState<any>(null);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch request details and user profiles
  useEffect(() => {
    const loadChatData = async () => {
      if (!requestId) return;
      
      try {
        // Get request details
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select(`
            *,
            trip:trips(*),
            shipper:users(*),
            trucker:trips!requests_trip_id_fkey(trucker:users(*))
          `)
          .eq('id', requestId)
          .single();

        if (requestError) throw requestError;
        
        setRequest(requestData);
        
        // Determine recipient based on user type
        let recipientId: string | null = null;
        if (userProfile?.user_type === 'trucker') {
          recipientId = requestData.shipper_id;
        } else if (userProfile?.user_type === 'shipper') {
          recipientId = requestData.trip?.trucker_id;
        }
        
        // Fetch recipient profile
        if (recipientId) {
          const { data: recipientData, error: recipientError } = await supabase
            .from('users')
            .select('*')
            .eq('id', recipientId)
            .single();
            
          if (!recipientError && recipientData) {
            setRecipientProfile(recipientData);
          }
        }
        
        // Fetch current user profile
        if (userProfile?.id) {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userProfile.id)
            .single();
            
          if (!profileError && profileData) {
            setUserProfileData(profileData);
          }
        }
        
        // Load initial messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });
          
        if (!messagesError) {
          setMessages(messagesData || []);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
        showError('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [requestId, userProfile]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!requestId || !userProfile?.id) return;

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        const newMessage = payload.new;
        // Avoid adding duplicate messages
        if (!messages.some(msg => msg.id === newMessage.id)) {
          setMessages(prev => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, userProfile?.id, messages.length]);

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !requestId || !userProfile?.id) return;

    try {
      // Determine recipient
      let recipientId: string | null = null;
      if (userProfile?.user_type === 'trucker') {
        recipientId = request?.shipper_id;
      } else if (userProfile?.user_type === 'shipper') {
        recipientId = request?.trip?.trucker_id;
      }

      if (!recipientId) {
        showError('Unable to determine recipient');
        return;
      }

      // Insert message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          request_id: requestId,
          sender_id: userProfile.id,
          recipient_id: recipientId,
          content: newMessage.trim()
        });

      if (insertError) throw insertError;

      // Clear input
      setNewMessage('');
      
      // Notify recipient they have a new message (optional)
      // This could trigger a notification, but we'll keep it simple for now
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  };

  // Handle Enter key in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Handle typing indicator (optional, can be removed for simplicity)
  const handleTyping = () => {
    setIsTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-300 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Chat not found</p>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-900">{recipientProfile?.full_name || 'Chat'}</p>
            <p className="text-xs text-gray-500">
              {recipientProfile?.user_type === 'trucker' ? 'Trucker' : 'Shipper'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isTyping && (
            <div className="flex space-x-1 text-sm text-gray-500">
              <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
              <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
              <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              if (recipientProfile?.phone) {
                navigate(`/tel:${recipientProfile.phone}`);
              }
            }}
          >
            <Phone className="h-4 w-4 text-gray-600 hover:text-gray-900" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwnMessage = msg.sender_id === userProfile?.id;
              const senderProfile = isOwnMessage ? userProfileData : recipientProfile;
              
              return (
                <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-lg ${isOwnMessage ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {senderProfile && (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={senderProfile.avatar_url || '/placeholder.svg'} 
                              alt={senderProfile.full_name} 
                            />
                            <AvatarFallback>{senderProfile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{senderProfile.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-white px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleTyping}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || !requestId}
            className="px-4 py-2"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;