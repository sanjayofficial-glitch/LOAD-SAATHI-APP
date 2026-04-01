"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { getToken } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { supabase } from "@/lib/supabaseClient";

const AuthSync = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const handleAuthSync = async () => {
      try {
        // Get Supabase auth token from Clerk
        const supabaseToken = await getToken({ template: "supabase" });
        if (!supabaseToken) {
          console.error("[AuthSync] Failed to get Supabase token");
          return;
        }

        // Create Supabase client with Clerk JWT
        const supabaseClient = createClerkSupabaseClient(supabaseToken);

        // Query the public.users table for the user
        const { data, error } = await supabaseClient
          .from("users")
          .select("user_type")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("[AuthSync] Error fetching user:", error);
          // If user not found in DB, redirect to role selection
          navigate("/choose-role");
          return;
        }

        // Redirect based on user_type
        if (data.user_type === "shipper") {
          navigate("/shipper/dashboard");
        } else if (data.user_type === "trucker") {
          navigate("/trucker/dashboard");
        } else {
          // Fallback to role selection if user_type is unexpected
          navigate("/choose-role");
        }
      } catch (err) {
        console.error("[AuthSync] Error:", err);
        // On error, redirect to role selection as fallback
        navigate("/choose-role");
      }
    };

    handleAuthSync();
  }, [isLoaded, isSignedIn, user, navigate]);

  // This component renders nothing - it's purely for logic
  return null;
};

export default AuthSync;