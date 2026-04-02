"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "shipper" | "trucker" | "both";
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

  // No user – redirect to role selection
  if (!userProfile) {
    return <Navigate to="/choose-role" replace />;
  }

  // If a specific role is required and the current user doesn't match, redirect
  if (allowedRole && allowedRole !== "both" && userProfile.user_type !== allowedRole) {
    const targetPath =
      userProfile.user_type === "shipper" ? "/shipper/dashboard" : "/trucker/dashboard";
    return <Navigate to={targetPath} replace />;
  }

  // All checks passed – render the protected component  return <>{children}</>;
};

export default RoleProtectedRoute;