import type { NextRequest } from "next/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { requireUser } from "@/backend/middleware/auth";
import { enforceQuota } from "@/backend/middleware/quota";
import { withRetry } from "@/backend/middleware/errors";
import { createConversation, getConversation } from "@/backend/models/conversations";
import { addMessage } from "@/backend/models/messages";
import { validateGameId } from "@/features/game-selector";
import { isApprovedEmail } from "@/features/auth";
import {
  streamChatWithFallback,
  buildSystemPrompt,
  createSearchGameWikiTool,
} from "@/features/chat";

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

  // Phase de test : filet anti-quota — un compte non approuvé ne peut déclencher aucun appel Groq/Tavily
  if (!isApprovedEmail(user.email)) {
    return new Response("Accès non autorisé", { status: 403 });
  }

  const allowed = await enforceQuota(user.id);
  if (!allowed) {
    // Corps volontairement distinct de "Non authentifié" -> LDN-75 s'appuiera dessus côté UI
    return Response.json({ error: "quota_reached" }, { status: 429 });
  }

  const game = validateGameId(jeuId);
  if (!game) return new Response("Jeu inconnu", { status: 400 });

  // Supabase peut être injoignable (panne réseau) -> une tentative de plus avant d'abandonner
  let conversation;
  try {
    // Récupère la conversation existante, ou en crée une nouvelle si c'est le premier message
    conversation = conversationId
      ? (await withRetry(() => getConversation(conversationId, user.id), "supabase-get-conversation")).data
      : (await withRetry(() => createConversation(user.id, game.id, consoleName), "supabase-create-conversation")).data;
  } catch {
    return Response.json({ error: "technical_error" }, { status: 503 });
  }

  if (!conversation) return new Response("Conversation introuvable", { status: 404 });

  const lastUserText = messages[messages.length - 1]?.parts.find((part) => part.type === "text")?.text ?? "";
  await addMessage(conversation.id, "user", lastUserText);

  // Calculé une seule fois : réutilisé pour la tentative principale et, si besoin, celle de secours
  const modelMessages = await convertToModelMessages(messages);

  const stream = await streamChatWithFallback((model) =>
    streamText({
      model,
      system: buildSystemPrompt({ game, console: consoleName }),
      messages: modelMessages,
      tools: {
        searchGameWiki: createSearchGameWikiTool({ jeuId: game.id, sources: game.sources, question: lastUserText }),
      },
      // Sans ça, le flux s'arrête dès le premier appel d'outil. Le modèle (gpt-oss, raisonneur) peut
      // enchaîner plusieurs recherches avant de rédiger : 3 étaient trop peu (il atteignait la limite
      // avant de répondre -> réponse vide). On laisse une marge le temps qu'il produise sa réponse finale.
      stopWhen: isStepCount(5),
      // Dès qu'une recherche a eu lieu, on interdit tout nouvel appel d'outil : la seule action
      // possible devient rédiger la réponse -> plus de bulle vide quand le modèle s'entête à rechercher
      prepareStep: ({ steps }) => {
        const rechercheDejaFaite = steps.some((step) => step.toolCalls.length > 0);
        return rechercheDejaFaite ? { toolChoice: "none" } : {};
      },
      // Log serveur pour toute erreur pendant la génération (au cas où, même hors quota)
      onError: ({ error }) => {
        console.error("Erreur pendant la génération de la réponse IA :", error);
      },
      // Une fois le flux terminé, on enregistre la réponse complète de l'IA
      onFinish: async ({ text, finishReason, steps }) => {
        // Log de diagnostic : "tool-calls" + texte vide = le modèle a épuisé ses étapes sans rédiger
        console.log("Chat terminé :", { finishReason, steps: steps.length, longueurTexte: text.length });
        await addMessage(conversation.id, "assistant", text);
      },
    }),
  );

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream,
      // Attache l'id de conversation au message, pour que le client puisse le récupérer et le renvoyer ensuite
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return { conversationId: conversation.id };
        }
      },
      // Erreur en plein streaming (ex: Groq/Tavily tombe après le début de la réponse) -> le flux s'arrête
      // proprement et le client reçoit ce code générique, jamais le détail technique brut (cahier des charges 13.1)
      onError: () => "technical_error",
    }),
  });
}