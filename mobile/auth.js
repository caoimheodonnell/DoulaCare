// Supabase authentication helpers
// Based on Supabase Auth (Email and Password) documentation:
// https://supabase.com/docs/guides/auth/auth-email
// Uses Supabase JS client methods for sign-in, sign-up, session, and sign-out
// Includes custom helper to fetch user role from profiles table
import { supabase } from "./supabaseClient";
import api from "./api";


// Sign in user using email and password
// Based on Supabase Auth: signInWithPassword
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });


// Sign up a new user with email & password
// Adds custom role metadata to raw_user_meta_data at signup
// Based on Supabase Auth: signUp
export async function signUp(email, password, role) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });

  if (error) throw error;

  const authId = data?.user?.id;
  if (authId) {
    await api.post("/users/bootstrap", {
      auth_id: authId,
      role,
      name: "New user",
      location: null,
    });
  }

  return data;
}

// Sign out the current user
// Based on Supabase Auth: signOut
export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
};
// Custom helper: get role for currently authenticated user
// Combines Supabase Auth session with a database query
export const getMyRole = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return null;


  // Based on Supabase Database select syntax
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data?.role ?? null;
};

// Map auth uid to  app users table (int id)
export const getMyAppUserId = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (error) return null;
  return data?.id ?? null; // integer
};

// Get the currently authenticated Supabase user (auth UUID)
// Fetch the matching profile row from the public profiles table
  // This table stores app-specific data (e.g. role) separate from auth
export const getMyProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data; // { id: uuid, role: "mother"|"doula" }
};

// One helper AppGate can use
export const getBootstrapAuth = async () => {
  const user = await getCurrentUser();
  if (!user) return { role: null, appUserId: null };

  const profile = await getMyProfile(); // {id, role}
  const role = profile?.role ?? null;

  const appUserId = await getMyAppUserId(); // int from public.users

  return { role, appUserId };
};

