import { createClient } from "@/lib/supabase/server";

// Vérifie qu'un utilisateur est bien connecté, à appeler en tout début de chaque route API sensible.
// Ne fait jamais confiance à un id envoyé par le client : revalide le token à chaque appel.
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null; // Pas de session valide -> la route appelante doit refuser la requête
  }

  // data.claims.sub = identifiant unique de l'utilisateur (= profiles.id / auth.users.id)
  return { id: data.claims.sub, email: data.claims.email as string };
}