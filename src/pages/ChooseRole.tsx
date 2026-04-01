"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getToken } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { showError } from "@/utils/toast";

const ChooseRole = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedRole, setSelectedRole] = useState<"shipper" | "trucker">("shipper");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded && isSignedIn) {
      // Default to shipper if loaded while signed in
      setSelectedRole("shipper");
    }
  }, [isLoaded, isSignedIn]);

  const handleContinue = async () => {
    if (!isLoaded || !isSignedIn || !user) return;
    setLoading(true);
    setError(null);

    try {
      // Get Supabase auth token from Clerk
      const supabaseToken = await getToken({ template: "supabase" });
      if (!supabaseToken) {
        throw new Error("Failed to get Supabase token");
      }

      // Create Supabase client with Clerk JWT
      const supabase = createClerkSupabaseClient(supabaseToken);

      // Insert user profile into our database
      const { data, error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.primaryEmailAddress.emailAddress,
          user_type: selectedRole,
          full_name: user.fullName,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Navigate to appropriate dashboard
      navigate(selectedRole === "trucker" ? "/trucker/dashboard" : "/shipper/dashboard");
    } catch (err: any) {
      console.error("[ChooseRole] Error:", err);
      setError(err.message || "Something went wrong during signup");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to LoadSaathi!</h1>
      <p className="text-gray-600 mb-8">Please select your role to continue:</p>

      <form className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="role"
                value="shipper"
                checked={selectedRole === "shipper"}
                onChange={() => setSelectedRole("shipper")}
                className="h-4 w-4 text-orange-600"
              />
              <span className="text-sm font-medium text-gray-600">Shipper</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="role"
                value="trucker"
                checked={selectedRole === "trucker"}
                onChange={() => setSelectedRole("trucker")}
                className="h-4 w-4 text-orange-600"
              />
              <span className="text-sm font-medium text-gray-600">Trucker</span>
            </label>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleContinue}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing up...
            </>
          ) : "Continue"}
        </Button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
};

export default ChooseRole;