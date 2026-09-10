import { createClient } from "@/lib/supabase/server";

// Ajoute un message (utilisateur ou assistant) à une conversation existante
export async function addMessage(conversationId: string, role: "user" | "assistant", contenu: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, contenu })
    .select()
    .single();

  return { data, error };
}

// Récupère tous les messages d'une conversation, dans l'ordre chronologique
export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("date", { ascending: true });

  return { data, error };
}