"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Loader2, User, Truck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { showSuccess, showError } from '@/utils/toast';

const ChooseRole = () => {
  const { user, isLoaded } = useUser();
  const { refreshProfile, userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user already has a role
  useEffect(() => {
    if (userProfile?.user_type) {
      const targetPath = userProfile.user_type === 'shipper' ? '/shipper/dashboard' : '/trucker/dashboard';
      navigate(targetPath, { replace: true });
    }
  }, [userProfile, navigate]);

  const handleRoleSelection = async (role: "shipper" | "trucker") => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = await getAuthenticatedClient();
      
      // Use upsert to handle both new and existing users with the requested fields
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          user_type: role,
          full_name: user.fullName || '',
          phone: user.phoneNumbers?.[0]?.phoneNumber || user.primaryPhoneNumber?.phoneNumber || '',
          company_name: null,
          is_verified: true, // Setting to true as requested in the snippet
          rating: 0,
          total_trips: 0,
        }, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      // Refresh the profile in our context
      await refreshProfile();

      showSuccess(`Welcome ${role === 'shipper' ? 'Shipper' : 'Trucker'}!`);
      
      setTimeout(() => {
        navigate(role === 'shipper' ? '/shipper/dashboard' : '/trucker/dashboard', { replace: true });
      }, 100);
    } catch (err: any) {
      console.error("[ChooseRole] Error:", err);
      setError(err.message || "Failed to set role");
      showError(err.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Verifying account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 px-4">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-12">
          <div className="bg-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to LoadSaathi!</h1>
          <p className="text-lg text-gray-600">How will you be using the platform today?</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleRoleSelection("shipper")}
            disabled={loading}
            className="group relative flex flex-col items-center text-center bg-white hover:border-orange-500 border-2 border-transparent transition-all p-8 rounded-2xl shadow-sm hover:shadow-xl disabled:opacity-50"
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">I am a Shipper</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              I have goods to transport and want to find reliable trucks at the best prices.
            </p>
            <div className="mt-6 flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Select Shipper <CheckCircle2 className="ml-2 h-4 w-4" />
            </div>
          </button>

          <button
            onClick={() => handleRoleSelection("trucker")}
            disabled={loading}
            className="group relative flex flex-col items-center text-center bg-white hover:border-orange-500 border-2 border-transparent transition-all p-8 rounded-2xl shadow-sm hover:shadow-xl disabled:opacity-50"
          >
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Truck className="h-10 w-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">I am a Trucker</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              I have a truck and want to find loads to fill my empty space and earn more.
            </p>
            <div className="mt-6 flex items-center text-orange-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Select Trucker <CheckCircle2 className="ml-2 h-4 w-4" />
            </div>
          </button>
        </div>

        {loading && (
          <div className="mt-12 text-center animate-in fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Setting up your personalized dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseRole;