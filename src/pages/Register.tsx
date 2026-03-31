"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { showSuccess, showError } from '@/utils/toast';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSignUp } from '@clerk/clerk-react';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { signUp: clerkSignUp, isLoaded } = useSignUp();
  
  const [userType, setUserType] = useState<'trucker' | 'shipper' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!userType) {
      setErrorMsg('Please select whether you are a Shipper or a Trucker.');
      showError('Please select a user type');
      return;
    }

    setLoading(true);
    try {
      // The actual form is handled by Clerk's SignUp component
      // This is just for user type selection before Clerk flow
      const role = userType;
      localStorage.setItem('pendingUserType', role);
      showSuccess('Please complete registration in the Clerk form');
    } catch (err) {
      setErrorMsg('An unexpected error occurred.');
      showError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleClerkSignUp = async (data: any) => {
    try {
      // Store user type from localStorage (set before Clerk modal)
      const role = localStorage.getItem('pendingUserType') as 'trucker' | 'shipper' | null;
      if (!role) {
        showError('Please select a user type first');
        return;
      }

      // Add user metadata
      await clerkSignUp?.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.emailAddress,
        password: data.password,
        unsafeMetadata: {
          user_type: role,
          phone: data.phone || '',
          company_name: data.companyName || ''
        }
      });

      localStorage.removeItem('pendingUserType');
      showSuccess('Account created! Please check your email for verification.');
    } catch (err: any) {
      showError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join India's truck space marketplace</p>
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 p-4 bg-orange-50/50 rounded-lg border border-orange-100">
            <label className="text-sm font-medium text-gray-700 mb-2 block">I am a...</label>
            <RadioGroup 
              value={userType || ''} 
              onValueChange={(v: any) => setUserType(v)} 
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shipper" id="shipper" className="border-orange-300 text-orange-600" />
                <label htmlFor="shipper" className="cursor-pointer font-medium text-gray-700">Shipper</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trucker" id="trucker" className="border-orange-300 text-orange-600" />
                <label htmlFor="trucker" className="cursor-pointer font-medium text-gray-700">Trucker</label>
              </div>
            </RadioGroup>
            {!userType && <p className="text-[10px] text-orange-600 font-medium">* Required selection</p>}
          </div>

          <Button 
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 h-11 font-bold shadow-md"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Continuing...
              </>
            ) : 'Continue to Registration'}
          </Button>
        </form>

        <p className="text-center text-gray-600">
          Already have an account? <a href="/login" className="text-orange-600 font-medium hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;