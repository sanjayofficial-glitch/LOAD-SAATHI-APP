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

    // Using the specific JWT template name provided
    const token = await session.getToken({ template: "supabase-hs256" });
    
    if (!token) {
      throw new Error("Failed to retrieve authentication token");
    }

    return createClerkSupabaseClient(token);
  }, [session]);

  return { getAuthenticatedClient };
};