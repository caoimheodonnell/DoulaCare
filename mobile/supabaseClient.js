// Supabase client configuration for Expo / React Native
// Based on official Supabase JS client initialization:
// https://supabase.com/docs/reference/javascript/initializing
// Secure storage pattern adapted from Expo SecureStore docs:
// https://docs.expo.dev/versions/latest/sdk/securestore/

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";


// Supabase project URL and public anon key
// Pattern taken from Supabase docs: createClient(projectUrl, anonKey)
const supabaseUrl = "https://aroykjgencyysiszlobe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb3lramdlbmN5eXNpc3psb2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjkyMTgsImV4cCI6MjA3OTY0NTIxOH0.-aHQOFb2820cPQhQiTTZpE7-mCXkiu_YZvFHlC_z0zg";

// Create a single Supabase client instance for the app
// Similar to Supabase example:
// const supabase = createClient('https://xyzcompany.supabase.co', 'anon-key')
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
       // Store auth session securely on device
      getItem: SecureStore.getItemAsync,
      setItem: SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync,
    },
     // From Supabase auth docs:
    // automatically refresh JWT access tokens
    autoRefreshToken: true,
    // Persist session so user stays logged in after app restart
    persistSession: true,
    detectSessionInUrl: false,
  },
});
