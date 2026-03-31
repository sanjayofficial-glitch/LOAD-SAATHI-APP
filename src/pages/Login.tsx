"use client";

import { SignIn } from '@clerk/clerk-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Login = () => {
  const { isSignedIn, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn && userProfile) {
      navigate(userProfile.user_type === 'trucker' ? '/trucker/dashboard' : '/shipper/dashboard', { replace: true });
    }
  }, [isSignedIn, userProfile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (isSignedIn && userProfile) {
    return <Navigate to={userProfile.user_type === 'trucker' ? '/trucker/dashboard' : '/shipper/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignIn 
        routing="path" 
        path="/login" 
        signUpUrl="/register"
        afterSignInUrl="/"
        redirectUrl="/"
      />
    </div>
  );
};

export default Login;