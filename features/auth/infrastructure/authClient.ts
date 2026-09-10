import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// Id de l'utilisateur connecté, lu depuis la session serveur (jamais depuis un paramètre client)
export async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  return data.claims.sub as string;
}

// Supprime définitivement un utilisateur auth.users (déclenche les cascades FK).
// Requiert la clé service_role -> client admin, serveur uniquement, jamais exposé au navigateur.
export async function deleteUserById(userId: string) {
  const admin = createAdminClient();
  return admin.auth.admin.deleteUser(userId);
}