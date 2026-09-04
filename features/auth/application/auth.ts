import { signUpWithEmail, signInWithEmail, signOut as signOutInfra } from "@/features/auth/infrastructure/authClient";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signUp(email: string, password: string, pseudo: string) {
  const { data, error } = await signUpWithEmail(email, password);

  if (error || !data.user) {
    return { error: error?.message ?? "Inscription impossible" };
  }

  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: data.user.id, pseudo });

  if (profileError) {
    // Log serveur (visible dans le terminal npm run dev / logs Vercel) pour voir le vrai message Postgres
    console.error("Erreur création profil:", profileError);
    return { error: "Compte créé, mais erreur lors de la création du profil" };
  }

  return { error: null };
}

export async function signIn(email: string, password: string) {
  const { error } = await signInWithEmail(email, password);
  return { error: error?.message ?? null };
}

export async function signOut() {
  const { error } = await signOutInfra();
  return { error: error?.message ?? null };
}