"use client";

import { SignIn } from '@clerk/clerk-react';
import { Truck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { isSignedIn, userProfile } = useAuth();

  if (isSignedIn && userProfile) {
    return <Navigate to={userProfile.user_type === 'trucker' ? '/trucker/dashboard' : '/shipper/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-600 mt-2 mb-6">Sign in to your LoadSaathi account</p>
        </div>

        <SignIn 
          routing="path" 
          path="/login" 
          signUpUrl="/register"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-orange-600 hover:bg-orange-700 text-sm normal-case',
              card: 'shadow-none border-0 p-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              footer: 'hidden'
            }
          }}
        />
        
        <p className="text-center text-gray-600 mt-4">
          Don't have an account? <Link to="/register" className="text-orange-600 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;