import { requireUser } from "@/backend/middleware/auth";
import { validateGameId } from "@/features/game-selector/application/validateGameId";
import { createConversation, getConversation } from "@/backend/models/conversations";
import { addMessage, getMessages } from "@/backend/models/messages";

type ChatRequest = {
  conversationId?: string;
  jeuId: string;
  message: string;
};

// Point d'entrée métier appelé par la route API (app/api/chat/route.ts, LDN-56)
export async function handleChatMessage(request: ChatRequest) {
  // 1. Vérifie que l'utilisateur est bien connecté (jamais confiance au client)
  const user = await requireUser();
  if (!user) {
    return { error: "Non authentifié", status: 401 as const };
  }

  // 2. Vérifie que le jeu demandé existe vraiment et est actif
  const game = validateGameId(request.jeuId);
  if (!game) {
    return { error: "Jeu inconnu", status: 400 as const };
  }

  // 3. Récupère la conversation existante, ou en crée une nouvelle si c'est le premier message
  let conversation;
  if (request.conversationId) {
    const { data } = await getConversation(request.conversationId, user.id);
    conversation = data;
  } else {
    const { data } = await createConversation(user.id, game.id);
    conversation = data;
  }

  if (!conversation) {
    return { error: "Conversation introuvable", status: 404 as const };
  }

  // 4. Enregistre le message de l'utilisateur
  await addMessage(conversation.id, "user", request.message);

  // TODO (LDN-57 à LDN-60) : remplacer ce message provisoire par le vrai appel au moteur IA
  // (Groq + recherche Tavily + traduction) — pas encore construit à ce stade du projet.
  const reponseProvisoire = "Réponse de l'IA à venir (Epic 5, LDN-57).";
  await addMessage(conversation.id, "assistant", reponseProvisoire);

  const { data: messages } = await getMessages(conversation.id);

  return { conversation, messages, status: 200 as const };
}