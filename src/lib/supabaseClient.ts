"use client";

import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://grtuwjxwutwqfdbpehfc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydHV3anh3dXR3cWZkYnBlaGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDE4NzAsImV4cCI6MjA4OTc3Nzg3MH0.dj_XqLvDJQGA0V1WgoTKx8b598WN3ceJy7fN19GMwos';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});