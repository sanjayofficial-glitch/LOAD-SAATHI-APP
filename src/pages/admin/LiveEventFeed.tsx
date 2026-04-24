"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlusCircle, 
  CheckCircle2, 
  UserPlus, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface Event {
  id: string;
  type: 'trip' | 'booking' | 'user' | 'chat' | 'alert';
  message: string;
  time: string;
}

interface LiveEventFeedProps {
  events: Event[];
}

const LiveEventFeed: React.FC<LiveEventFeedProps> = ({ events }) => {
  const getIcon = (type: Event['type']) => {
    switch (type) {
      case 'trip': return <PlusCircle className="h-3 w-3 text-orange-500" />;
      case 'booking': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'user': return <UserPlus className="h-3 w-3 text-blue-500" />;
      case 'chat': return <MessageSquare className="h-3 w-3 text-purple-500" />;
      default: return <AlertCircle className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border border-slate-800 bg-slate-900/20 p-4">
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-8 uppercase font-bold tracking-widest">
            Waiting for system events...
          </p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex gap-3 items-start group">
              <div className="mt-0.5 p-1 rounded-full bg-slate-800 border border-slate-700 group-hover:border-slate-600 transition-colors">
                {getIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-300 leading-tight">
                  {event.message}
                </p>
                <p className="text-[9px] font-mono text-slate-500 mt-1">
                  {event.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default LiveEventFeed;