"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/types/chat";
import { sendMessage, fetchMessages, subscribeToNewMessages, markMessagesAsRead } from "@/utils/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { showSuccess, showError } from "@/utils/toast";
import { ChevronLeft, X } from "lucide-react";

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [showTyping, setShowTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial messages
  useEffect(() => {
    if (!requestId) return;

    const loadMessages = async () => {
      try {
        const msgs = await fetchMessages(requestId);
        setMessages(msgs);
      } catch (error) {
        console.error("Error loading messages:", error);
        showError("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [requestId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!requestId || !userProfile?.id) return;

    const cleanup = subscribeToNewMessages(requestId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      // Mark as unread when new message arrives      setShowTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setShowTyping(false), 3000);
    });

    return () => {
      cleanup();
      supabase.removeChannel(supabase.channel(`messages:${requestId}`));
    };
  }, [requestId, userProfile?.id]);

  // Mark messages as read when component mounts (optional)
  useEffect(() => {
    if (userProfile?.id && requestId) {
      const markAllAsRead = async () => {
        const messageIds = messages.map((msg) => msg.id);
        if (messageIds.length > 0) {
          await markMessagesAsRead(messageIds);
        }
      };
      markAllAsRead();
    }
  }, [messages, userProfile?.id, requestId]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !requestId || !userProfile?.id) return;

    setIsSending(true);
    try {
      const payload = {
        recipientId: userProfile.user_type === "trucker" ? request?.shipper_id : request?.trucker_id,
        content: newMessage.trim(),
        requestId,
      };

      const sentMessage = await sendMessage(payload);
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");
      showSuccess("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      showError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Determine recipient profile for display
  const recipient = request?.shipper_id ? "Shipper" : "Trucker";
  const recipientName = request?.shipper?.full_name || request?.trucker?.full_name || "Unknown";

  // Back button handler
  const handleBack = () => {
    navigate(-1);
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
          <Button variant="outline" onClick={handleBack} className="mt-4">
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
        <div className="flex items-center space-x-3 cursor-pointer" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-900">{recipientName}</p>
            <p className="text-xs text-gray-500">{recipient}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {showTyping && (
            <div className="flex space-x-1 text-sm text-gray-500">
              <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
              <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
              <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
          )}
          <Button            variant="ghost"
            size="icon"
            onClick={() => {
              if (request?.shipper?.phone) {
                navigate(`/tel:${request.shipper.phone}`);
              }
            }}
          >
            <X className="h-4 w-4 text-gray-600 hover:text-gray-900" />
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
              const senderProfile = isOwnMessage
                ? userProfile                : request?.shipper?.id === msg.sender_id
                ? request?.shipper                : request?.trucker;

              return (
                <div key={msg.id} className="flex">
                  <div className={`max-w-[70%] px-4 py-2 rounded-lg ${isOwnMessage ? "bg-orange-600 text-white" : "bg-white border border-gray-200"}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {senderProfile && (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={senderProfile.avatar_url || "/placeholder.svg"}
                              alt={senderProfile.full_name}
                            />
                            <AvatarFallback>{senderProfile.full_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{senderProfile.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
            placeholder="Type a message..."
            rows={2}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Button            type="submit"
            disabled={isSending || !newMessage.trim() || !requestId}
            className="px-4 py-2"
          >
            {isSending ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-orange-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H3z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;