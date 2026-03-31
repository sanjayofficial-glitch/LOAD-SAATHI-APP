"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const [searchParams] = useSearchParams();
  const { isSignedIn, userProfile } = useAuth();
  const [userType, setUserType] = useState<'trucker' | 'shipper'>('shipper');

  useEffect(() => {
    const type = searchParams.get('userType') as 'trucker' | 'shipper';
    if (type) setUserType(type);
  }, [searchParams]);

  if (isSignedIn && userProfile) {
    return <Navigate to={userProfile.user_type === 'trucker' ? '/trucker/dashboard' : '/shipper/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">
            Join as a {userType === 'trucker' ? 'Trucker' : 'Shipper'}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setUserType('shipper')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${userType === 'shipper' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Shipper
          </button>
          <button 
            onClick={() => setUserType('trucker')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${userType === 'trucker' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Trucker
          </button>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
          view="sign_up"
          additionalData={{
            full_name: '',
            user_type: userType
          }}
        />
        
        <p className="text-center text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-orange-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;