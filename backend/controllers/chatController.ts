import type { NextRequest } from "next/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { requireUser } from "@/backend/middleware/auth";
import { validateGameId } from "@/features/game-selector/application/validateGameId";
import { createConversation, getConversation } from "@/backend/models/conversations";
import { addMessage } from "@/backend/models/messages";
import { buildSystemPrompt } from "@/features/chat/application/buildSystemPrompt";
import { createSearchGameWikiTool } from "@/features/chat/application/searchTool";
import { createTranslateTermsTool } from "@/features/chat/application/translateTermsTool";
import { createSaveTranslationsTool } from "@/features/chat/application/saveTranslationsTool";

// Toute la logique métier du chat vit ici — route.ts se contente de retourner ce que cette fonction renvoie
export async function handleChatMessage(request: NextRequest) {
  const { messages, conversationId, jeuId, console: consoleName } = (await request.json()) as {
    messages: UIMessage[];
    conversationId?: string;
    jeuId: string;
    console: string;
  };

  const user = await requireUser();
  if (!user) return new Response("Non authentifié", { status: 401 });

  const game = validateGameId(jeuId);
  if (!game) return new Response("Jeu inconnu", { status: 400 });

  // Récupère la conversation existante, ou en crée une nouvelle si c'est le premier message
  const conversation = conversationId
    ? (await getConversation(conversationId, user.id)).data
    : (await createConversation(user.id, game.id)).data;

  if (!conversation) return new Response("Conversation introuvable", { status: 404 });

  const lastUserText = messages[messages.length - 1]?.parts.find((part) => part.type === "text")?.text ?? "";
  await addMessage(conversation.id, "user", lastUserText);

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
    system: buildSystemPrompt({ game, console: consoleName }),
    messages: await convertToModelMessages(messages),
    tools: {
      searchGameWiki: createSearchGameWikiTool({ jeuId: game.id, sources: game.sources }),
      translateTerms: createTranslateTermsTool({ jeuId: game.id, gameName: game.nom }),
      saveTranslations: createSaveTranslationsTool({ jeuId: game.id }),
    },
    // Sans ça, le flux s'arrête dès le premier appel d'outil — on autorise jusqu'à 5 étapes
    // (recherche -> traduction -> sauvegarde -> réponse finale) avant de forcer l'arrêt.
    stopWhen: isStepCount(5),
    // Une fois le flux terminé, on enregistre la réponse complète de l'IA
    onFinish: async ({ text }) => {
      await addMessage(conversation.id, "assistant", text);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // Attache l'id de conversation au message, pour que le client puisse le récupérer et le renvoyer ensuite
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return { conversationId: conversation.id };
        }
      },
    }),
  });
}