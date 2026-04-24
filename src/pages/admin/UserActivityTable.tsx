import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserActivityTableProps {
  users: any[];
}

const UserActivityTable: React.FC<UserActivityTableProps> = ({ users }) => {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User ID</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Last Activity</TableCell>
            <TableCell>Location</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.user_type}</TableCell>
              <TableCell>{new Date(user.last_activity || user.created_at).toLocaleTimeString()}</TableCell>
              <TableCell>{user.location || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default UserActivityTable;