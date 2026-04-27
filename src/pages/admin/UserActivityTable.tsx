"use client";

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Clock } from 'lucide-react';

interface UserActivityTableProps {
  users: any[];
}

const UserActivityTable: React.FC<UserActivityTableProps> = ({ users }) => {
  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 w-full rounded border border-slate-800 bg-slate-900/20">
        <Table>
          <TableHeader className="bg-slate-900/50 sticky top-0 z-10">
            <TableRow className="border-slate-800 hover:bg-transparent h-8">
              <TableHead className="text-[8px] uppercase font-black text-slate-500 px-3">USER</TableHead>
              <TableHead className="text-[8px] uppercase font-black text-slate-500 px-3">ROLE</TableHead>
              <TableHead className="text-[8px] uppercase font-black text-slate-500 px-3 text-right">ACTIVITY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors h-10">
                <TableCell className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
                      <User className="h-3 w-3 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-300 truncate max-w-[100px]">
                        {user.full_name || 'ANON_NODE'}
                      </p>
                      <p className="text-[7px] text-slate-600 font-mono truncate">
                        {user.id.split('_')[1]?.slice(0, 12) || user.id.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-3">
                  <Badge className={`text-[7px] px-1.5 py-0 border-0 ${
                    user.user_type === 'trucker' 
                      ? 'bg-orange-500/10 text-orange-500' 
                      : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {user.user_type?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-slate-500">
                    <span className="text-[8px] font-mono">
                      {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Clock className="h-2.5 w-2.5" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default UserActivityTable;