import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { User } from '@/types';

interface UserActivityTableProps {
  users: User[];
}

const UserActivityTable: React.FC<UserActivityTableProps> = ({ users }) => {
  return (
    <TableContainer component="div" sx={{ maxHeight: 500, overflow: 'auto' }}>
      <Table stickyHeader aria-label="persistent table">
        <TableHead>
          <TableRow>
            <TableCell>User ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Activity</TableCell>
            <TableCell>Location</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.user_type}</TableCell>
              <TableCell>
                {user.is_verified ? (
                  <span className="text-green-600 font-medium">Verified</span>
                ) : (
                  <span className="text-red-600">Pending</span>
                )}
              </TableCell>
              <TableCell>{new Date(user.last_activity).toLocaleString()}</TableCell>
              <TableCell>{user.location || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserActivityTable;