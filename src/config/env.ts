/**
 * Centralized environment variable configuration.
 * Provides type-safe access and validates required variables on startup.
 */

export const env = {
  CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
} as const;

// Validate required environment variables
const requiredVars = ['CLERK_PUBLISHABLE_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

requiredVars.forEach((key) => {
  if (!env[key]) {
    throw new Error(
      `Missing required environment variable: VITE_${key}. Please check your .env file.`
    );
  }
});

export default env;