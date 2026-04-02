"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useSession } from '@clerk/clerk-react';
import { Loader2, User, Truck } from 'lucide-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { showSuccess, showError } from '@/utils/toast';

const ChooseRole = () => {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelection = async (role: "shipper" | "trucker") => {
    if (!user || !session) return;

    setLoading(true);
    setError(null);

    try {
      const supabaseToken = await session.getToken({ template: "supabase" });
      if (!supabaseToken) throw new Error("No Supabase token available");

      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          user_type: role,
          email: user.primaryEmailAddress?.emailAddress || '',
          full_name: user.fullName || '',
          phone: user.primaryPhoneNumber?.phoneNumber || '',
          is_verified: false,
          rating: 0,
          total_trips: 0,
          created_at: user.createdAt || new Date().toISOString()
        }, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      showSuccess(`Welcome ${role === 'shipper' ? 'Shipper' : 'Trucker'}!`);
      navigate(role === 'shipper' ? '/shipper/dashboard' : '/trucker/dashboard', { replace: true });
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to LoadSaathi!</h1>
          <p className="text-gray-600">Please select your role to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={() => handleRoleSelection("shipper")}
            disabled={loading}
            className="flex items-center justify-between w-full bg-orange-600 hover:bg-orange-700 transition-colors p-4 rounded-lg disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">I am a Shipper</h2>
              <p className="text-sm text-gray-500">Find trucks and ship your goods efficiently</p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelection("trucker")}
            disabled={loading}
            className="flex items-center justify-between w-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors p-4 rounded-lg disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">I am a Trucker</h2>
              <p className="text-sm text-gray-500">Find loads and maximize your earnings</p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseRole;