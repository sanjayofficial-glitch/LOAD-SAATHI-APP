"use client";

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'shipper' | 'trucker';
}

const RoleProtectedRoute = ({ children, allowedRole }: RoleProtectedRouteProps) => {
  const { userProfile, loading, isLoaded } = useAuth();

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/choose-role" replace />;
  }

  if (userProfile.user_type !== allowedRole) {
    // Redirect to their correct dashboard if they try to access the wrong one
    const targetPath = userProfile.user_type === 'shipper' ? '/shipper/dashboard' : '/trucker/dashboard';
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;