"use client";

import { SignIn } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { isSignedIn, userProfile } = useAuth();

  if (isSignedIn && userProfile) {
    return <Navigate to={userProfile.user_type === 'trucker' ? '/trucker/dashboard' : '/shipper/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <SignIn 
        routing="path" 
        path="/login" 
        signUpUrl="/register"
      />
    </div>
  );
};

export default Login;