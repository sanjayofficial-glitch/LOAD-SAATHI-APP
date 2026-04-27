"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Package } from 'lucide-react';

interface Event {
  id: string;
  type: 'trip' | 'alert' | 'booking' | 'user' | 'chat';
  message: string;
  time: string;
}

interface LiveEventFeedProps {
  events: Event[];
}

const LiveEventFeed: React.FC<LiveEventFeedProps> = ({ events }) => {
  return (
    <ScrollArea className="flex-1 w-full">
      <div className="space-y-3 font-mono">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 items-start group border-b border-slate-800/50 pb-3 last:border-0">
            <div className="mt-1 p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-orange-500/50 transition-colors">
              {event.type === 'booking' ? (
                <PlusCircle className="h-3 w-3 text-orange-500" />
              ) : (
                <Package className="h-3 w-3 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 leading-tight font-bold">
                {event.message}
              </p>
              <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter">
                {event.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default LiveEventFeed;