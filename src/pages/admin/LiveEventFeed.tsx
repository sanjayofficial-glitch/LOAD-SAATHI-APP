"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Package, Truck } from 'lucide-react';

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
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 items-start group border-b border-slate-800/30 pb-3 last:border-0">
            <div className="mt-0.5 p-1.5 rounded bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-colors">
              {event.type === 'booking' ? (
                <Package className="h-3 w-3 text-orange-500" />
              ) : (
                <Truck className="h-3 w-3 text-cyan-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-300 leading-tight font-bold uppercase tracking-tighter">
                {event.message}
              </p>
              <p className="text-[8px] text-slate-600 mt-1 font-black">
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