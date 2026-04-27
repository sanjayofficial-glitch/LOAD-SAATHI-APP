"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children?: React.ReactNode;
  allowedRole?: 'shipper' | 'trucker' | 'both' | 'admin';
}

// Only this specific user ID is allowed to access admin features
const ALLOWED_ADMIN_ID = "user_3Cn2O5bwNC0wsSEfGDnTky9rn2S";

const RoleProtectedRoute = ({ children, allowedRole }: RoleProtectedRouteProps) => {
  const { userProfile, loading, isLoaded } = useAuth();

  // Loading state – show a spinner while checking auth status
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // No user – redirect to home
  if (!userProfile) {
    return <Navigate to="/" replace />;
  }

  // Strict check for admin role: must have the admin type AND the specific allowed ID
  if (allowedRole === 'admin') {
    if (userProfile.user_type !== 'admin' || userProfile.id !== ALLOWED_ADMIN_ID) {
      console.warn(`[Security] Unauthorized admin access attempt by user: ${userProfile.id}`);
      return <Navigate to="/" replace />;
    }
  }

  // If a specific role is required and the current user doesn't match, redirect to their own dashboard
  if (allowedRole && allowedRole !== 'both' && allowedRole !== 'admin' && userProfile.user_type !== allowedRole) {
    let targetPath = '/';
    if (userProfile.user_type === 'shipper') targetPath = '/shipper/dashboard';
    else if (userProfile.user_type === 'trucker') targetPath = '/trucker/dashboard';
    else if (userProfile.user_type === 'admin') targetPath = '/admin/monitoring';
    
    return <Navigate to={targetPath} replace />;
  }

  // All checks passed – render children if provided, otherwise render nested routes via Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default RoleProtectedRoute;