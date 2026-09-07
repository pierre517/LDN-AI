import { createClient } from "@/lib/supabase/server";

// Forme d'une conversation renvoyée par cette couche (snake_case de la base converti en camelCase)
type ConversationRow = {
  id: string;
  jeuId: string;
  date: string;
};

// Récupère toutes les conversations d'un utilisateur, de la plus récente à la plus ancienne.
// La RLS Supabase garantit déjà qu'on ne lit que ses propres lignes ; le filtre user_id est une sécurité de plus.
export async function getUserConversations(userId: string): Promise<ConversationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, jeu_id, date")
    .eq("user_id", userId)
    .order("date", { ascending: false }); // false = ordre décroissant, les plus récentes d'abord

  if (error) {
    console.error("Erreur lecture conversations:", error);
    return [];
  }

  // Conversion snake_case (base) -> camelCase (notre domaine), comme gamesConfig le fait pour le YAML
  return (data ?? []).map((row) => ({
    id: row.id,
    jeuId: row.jeu_id,
    date: row.date,
  }));
}
