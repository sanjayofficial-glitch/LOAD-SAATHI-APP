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
import { User, Truck, Package, Clock } from 'lucide-react';

interface UserActivityTableProps {
  users: any[];
}

const UserActivityTable: React.FC<UserActivityTableProps> = ({ users }) => {
  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 w-full rounded-md border border-slate-800 bg-slate-900/30">
        <Table>
          <TableHeader className="bg-slate-900/50 sticky top-0 z-10">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-[10px] uppercase font-black text-slate-500 h-10">User</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-500 h-10">Role</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-500 h-10">Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-slate-500 text-xs">
                  No active users detected
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                          {user.full_name || 'Anonymous'}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono truncate">
                          {user.id.split('-')[0]}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.user_type === 'trucker' ? (
                      <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] px-1.5 py-0">
                        <Truck className="h-2.5 w-2.5 mr-1" /> TRUCKER
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] px-1.5 py-0">
                        <Package className="h-2.5 w-2.5 mr-1" /> SHIPPER
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-mono">
                        {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default UserActivityTable;