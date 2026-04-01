"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { getToken } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";

const AuthSync = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const handleAuthSync = async () => {
      try {
        const supabaseToken = await getToken({ template: "supabase" });
        if (!supabaseToken) {
          console.error("[AuthSync] Failed to get Supabase token");
          return;
        }

        const supabaseClient = createClerkSupabaseClient(supabaseToken);

        const { data, error } = await supabaseClient
          .from("users")
          .select("user_type")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("[AuthSync] Error fetching user:", error);
          navigate("/choose-role");
          return;
        }

        if (data.user_type === "shipper") {
          navigate("/shipper/dashboard");
        } else if (data.user_type === "trucker") {
          navigate("/trucker/dashboard");
        } else {
          navigate("/choose-role");
        }
      } catch (err) {
        console.error("[AuthSync] Error:", err);
        navigate("/choose-role");
      }
    };

    handleAuthSync();
  }, [isLoaded, isSignedIn, user, navigate]);

  return null;
};

export default AuthSync;