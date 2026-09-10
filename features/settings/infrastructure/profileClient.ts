import { createClient } from "@/lib/supabase/server";

// Lit le pseudo du profil de l'utilisateur.
// Client "utilisateur connecté" : la table profiles a une RLS "son propre profil" + le grant select à authenticated,
// donc on ne peut lire que sa propre ligne — c'est la protection voulue (donnée personnelle).
export async function getPseudo(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("pseudo")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erreur lecture profil:", error);
    return null;
  }

  return data?.pseudo ?? null;
}
