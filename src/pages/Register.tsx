"use client";

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<'trucker' | 'shipper' | null>(null);

  useEffect(() => {
    const userTypeParam = searchParams.get('userType') as 'trucker' | 'shipper' | null;
    if (userTypeParam) {
      setUserType(userTypeParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">
            {userType === 'trucker' ? 'Join as a Trucker' : userType === 'shipper' ? 'Join as a Shipper' : 'Join India\'s truck space marketplace'}
          </p>
        </div>

        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white',
              card: 'shadow-none',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'border border-gray-200 hover:bg-gray-50',
            }
          }}
          redirectUrl="/dashboard"
          afterSignUpUrl="/dashboard"
          unsafeMetadata={{
            user_type: userType || 'shipper'
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