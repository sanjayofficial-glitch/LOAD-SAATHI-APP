import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, User, Truck } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Chat = () => {
  const { requestId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRequestDetails();
    fetchMessages();
    subscribeToMessages();
  }, [requestId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchRequestDetails = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*, trip:trips(*, trucker:users(*)), shipper:users(*)')
      .eq('id', requestId)
      .single();
    
    if (data) setRequest(data);
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile) return;

    const { error } = await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: userProfile.id,
      content: newMessage.trim()
    });

    if (error) showError('Failed to send message');
    else setNewMessage('');
  };

  if (loading) return <div className="p-8 text-center">Loading chat...</div>;
  if (!request) return <div className="p-8 text-center">Chat not found</div>;

  const otherUser = userProfile?.user_type === 'trucker' ? request.shipper : request.trip.trucker;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            {otherUser?.user_type === 'trucker' ? <Truck className="h-5 w-5 text-orange-600" /> : <User className="h-5 w-5 text-orange-600" />}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{otherUser?.full_name}</h2>
            <p className="text-xs text-gray-500">{request.goods_description}</p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-orange-100">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === userProfile?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender_id === userProfile?.id
                      ? 'bg-orange-600 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-900 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                  <div className={`text-[10px] mt-1 opacity-70 ${msg.sender_id === userProfile?.id ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-white"
            />
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Chat;