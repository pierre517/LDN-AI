import { createClient } from "@/lib/supabase/server";

export async function signUpWithEmail(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = await createClient();
  return supabase.auth.signOut();
}