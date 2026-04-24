"use client";

import { useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Loader2 } from "lucide-react";

const AuthSync = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const handleAuthSync = async () => {
      try {
        const supabaseToken = await session?.getToken({ template: "supabase" });
        if (!supabaseToken) {
          console.error("[AuthSync] Failed to get Supabase token");
          setChecking(false);
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

        if (data?.user_type === "shipper") {
          navigate("/shipper/dashboard");
        } else if (data?.user_type === "trucker") {
          navigate("/trucker/dashboard");
        } else if (data?.user_type === "admin") {
          navigate("/admin/monitoring");
        } else {
          navigate("/choose-role");
        }
      } catch (err) {
        console.error("[AuthSync] Error:", err);
        navigate("/choose-role");
      } finally {
        setChecking(false);
      }
    };

    handleAuthSync();
  }, [isLoaded, isSignedIn, user, session, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthSync;