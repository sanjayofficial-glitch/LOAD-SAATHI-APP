"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "shipper" | "trucker" | "both" | "admin";
}

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

  // No user – redirect to role selection or home
  if (!userProfile) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required and the current user doesn't match, redirect
  if (allowedRole && userProfile.user_type !== allowedRole) {
    // Special handling for admin role    if (allowedRole === "admin" && userProfile.user_type !== "admin") {
      // For admin, we might want to redirect to a different path or show an error
      return <Navigate to="/admin" replace />;
    }
    
    const targetPath =
      userProfile.user_type === "shipper" ? "/shipper/dashboard" : "/trucker/dashboard";
    return <Navigate to={targetPath} replace />;
  }

  // All checks passed – render the protected component
  return <>{children}</>;
};

export default RoleProtectedRoute;