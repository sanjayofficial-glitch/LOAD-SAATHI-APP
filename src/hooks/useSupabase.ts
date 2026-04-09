"use client";

import { useSession } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useCallback } from "react";

export const useSupabase = () => {
  const { session } = useSession();

  const getAuthenticatedClient = useCallback(async () => {
    if (!session) {
      throw new Error("No active session found");
    }

    // Using the standard 'supabase' template name
    const token = await session.getToken({ template: "supabase" });
    
    if (!token) {
      throw new Error("Failed to retrieve authentication token. Ensure you have a JWT template named 'supabase' in your Clerk dashboard.");
    }

    return createClerkSupabaseClient(token);
  }, [session]);

  return { getAuthenticatedClient };
};