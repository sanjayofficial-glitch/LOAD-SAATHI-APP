"use client";

import React, { useState } from "react";
import { useUser, useSession } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Loader2, Truck, Package } from "lucide-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";

const ChooseRole = () => {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelection = async (role: "shipper" | "trucker") => {
    if (!isLoaded || !user || !session) return;
    
    setLoading(true);
    setError(null);

    try {
      const supabaseToken = await session.getToken({ template: "supabase" });
      if (!supabaseToken) {
        throw new Error("Failed to get Supabase token from Clerk");
      }

      const supabase = createClerkSupabaseClient(supabaseToken);

      // Prepare user data with ALL required fields from the users table
      const userData = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        user_type: role,
        full_name: user.fullName || "",
        phone: user.primaryPhoneNumber?.phoneNumber || "",
        company_name: null,
        is_verified: false,
        rating: 0,
        total_trips: 0,
        created_at: user.createdAt || new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("users")
        .upsert(userData, {
          onConflict: 'id'
        });

      if (upsertError) {
        throw upsertError;
      }

      // Refresh the user profile in AuthContext to update the user_type
      const updatedProfile = await refreshProfile();
      
      // Verify that the profile was updated with the correct role
      if (!updatedProfile || updatedProfile.user_type !== role) {
        throw new Error(`Failed to set role to ${role}. Current role: ${updatedProfile?.user_type || 'none'}. Please try again or contact support.`);
      }

      navigate(role === "shipper" ? "/shipper/dashboard" : "/trucker/dashboard");
    } catch (err: any) {
      console.error("[ChooseRole] Error:", err);
      setError(err.message || "Something went wrong during role selection");
      showError(err.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 px-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to LoadSaathi!</h1>
          <p className="text-gray-600">Please select your role to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleRoleSelection("shipper")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-8 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I am a Shipper</h2>
            <p className="text-sm text-gray-500 text-center">Find trucks and ship your goods efficiently</p>
          </button>

          <button
            onClick={() => handleRoleSelection("trucker")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-8 border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Truck className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I am a Trucker</h2>
            <p className="text-sm text-gray-500 text-center">Find loads and maximize your earnings</p>
          </button>
        </div>

        {loading && (
          <div className="mt-8 text-center">
            <Loader2 className="h-6 w-6 text-orange-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Setting up your account...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChooseRole;