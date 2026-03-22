import { createClient } from '@supabase/supabase-js';

// Use Vercel environment variables with fallback to hardcoded values for local development
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://grtuwjxwutwqfdbpehfc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZnluZmVwaXJ6dGJjeWJxZmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTc1MjYsImV4cCI6MjA4OTYzMzUyNn0.KiPncVzIhvMCF8iy4fESV7gPzvrX43nmMIQX6YM9Ivk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);