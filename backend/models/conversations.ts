import { createClient } from "@/lib/supabase/server";

// Crée une nouvelle conversation pour un utilisateur et un jeu donnés
export async function createConversation(userId: string, jeuId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, jeu_id: jeuId })
    .select()
    .single();

  return { data, error };
}

// Récupère une conversation précise, en vérifiant qu'elle appartient bien à l'utilisateur demandeur
export async function getConversation(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId) // double vérif en plus de RLS : jamais confiance à un id transmis par le client seul
    .single();

  return { data, error };
}