"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Users, Clock, TrendingUp } from 'lucide-react';

interface ChatMonitoringPanelProps {
  metrics: { totalChats: number; activeChats: number; messagesToday: number; avgResponseTime: number };
}

const ChatMonitoringPanel: React.FC<ChatMonitoringPanelProps> = ({ metrics }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="h-3 w-3 text-purple-400" />
          </div>
          <p className="text-lg font-mono font-bold text-slate-100">{metrics.totalChats}</p>
          <p className="text-[9px] text-slate-500 uppercase font-bold">Total Chats</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-3 w-3 text-green-400" />
          </div>
          <p className="text-lg font-mono font-bold text-slate-100">{metrics.activeChats}</p>
          <p className="text-[9px] text-slate-500 uppercase font-bold">Active Now</p>
        </CardContent>
      </Card>
    </div>
  </div>
);
export default ChatMonitoringPanel;