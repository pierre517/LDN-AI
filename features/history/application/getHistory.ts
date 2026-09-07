import { validateGameId } from "@/features/game-selector";
import { getUserConversations } from "../infrastructure/conversationsClient";
import type { ConversationSummary } from "../domain/types";

// Récupère l'historique d'un utilisateur, prêt à afficher :
// on remplace le slug jeu_id (ex. "elden-ring") par le vrai nom du jeu (ex. "Elden Ring").
export async function getHistory(userId: string): Promise<ConversationSummary[]> {
  const conversations = await getUserConversations(userId);

  return conversations.map((conversation) => {
    const game = validateGameId(conversation.jeuId);

    return {
      id: conversation.id,
      // Si le jeu n'est plus dans la config, on retombe sur le slug brut plutôt que d'afficher un vide
      jeuNom: game?.nom ?? conversation.jeuId,
      date: conversation.date,
    };
  });
}
