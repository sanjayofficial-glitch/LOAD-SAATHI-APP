"use client";

import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useCallback } from "react";

export const useSupabase = () => {
  const { getToken } = useClerkAuth();

  const getAuthenticatedClient = useCallback(async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No authentication token found");
    return createClerkSupabaseClient(token);
  }, [getToken]);

  return { getAuthenticatedClient };
};