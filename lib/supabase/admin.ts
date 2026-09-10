import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    // Clé service_role = pas une session utilisateur : inutile de persister ou rafraîchir un token
    // (reco doc Supabase pour un client admin serveur only)
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}