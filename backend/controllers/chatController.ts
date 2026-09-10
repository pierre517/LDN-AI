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
import { validateGameId, getGlossary } from "@/features/game-selector";
import { isApprovedEmail } from "@/features/auth";
import {
  ANSWER_MODEL,
  buildSystemPrompt,
  createSearchGameWikiTool,
  findGlossaryMatches,
  buildTranslationPrompt,
  streamTranslation,
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

  // Jeu avec glossaire -> pipeline 2 étapes (réponse anglaise puis traduction française). null sinon.
  const glossaire = getGlossary(game);

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

  // Calculé une seule fois : réutilisé pour l'étape 1 et, si besoin, l'étape de traduction
  const modelMessages = await convertToModelMessages(messages);

  // Étape 1 : génère la réponse. En anglais pour un jeu à glossaire (traduite ensuite), en français sinon.
  const reponse = streamText({
    model: ANSWER_MODEL,
    system: buildSystemPrompt({ game, console: consoleName }),
    messages: modelMessages,
    tools: {
      searchGameWiki: createSearchGameWikiTool({
        jeuId: game.id,
        jeuNom: game.nom,
        sources: game.sources,
        question: lastUserText,
  // Jeu avec glossaire -> sources et requêtes en anglais (pipeline traduction)
        langue: glossaire ? "en" : "fr",
      }),
    },
    // Sans ça, le flux s'arrête dès le premier appel d'outil. Le modèle (gpt-oss, raisonneur) peut
    // enchaîner plusieurs recherches avant de rédiger : 3 étaient trop peu (il atteignait la limite
    // avant de répondre -> réponse vide). On laisse une marge le temps qu'il produise sa réponse finale.
    stopWhen: isStepCount(5),
    // Dès qu'une recherche a eu lieu, l'étape suivante ne sert qu'à rédiger la réponse.
    // gpt-oss ré-appelle l'outil tant qu'il en voit des traces (même avec tool_choice "none",
    // d'où les 400 Groq) : on lui envoie donc une conversation 100% texte, sans outil déclaré
    // ni trace d'appel, avec les résultats réinjectés en message utilisateur.
    prepareStep: ({ steps, messages }) => {
      const rechercheDejaFaite = steps.some((step) => step.toolCalls.length > 0);
      if (!rechercheDejaFaite) return {};

      const resultats = steps.flatMap((step) => step.toolResults.map((r) => JSON.stringify(r.output)));
      // Retire les messages d'appel d'outil (assistant) et de résultat d'outil (tool) de l'historique
      const messagesSansTracesOutil = messages.filter((message) => {
        if (message.role === "tool") return false;
        if (message.role === "assistant" && Array.isArray(message.content)) {
          return !message.content.some((part) => part.type === "tool-call");
        }
        return true;
      });

      // Consigne de rédaction dans la langue attendue (anglais pour un jeu à glossaire)
      const consigne = glossaire
        ? `Search results:\n${resultats.join("\n")}\n\nNow write your answer to my question based only on these results.`
        : `Résultats de la recherche :\n${resultats.join("\n")}\n\nRédige maintenant ta réponse à ma question en te basant uniquement sur ces résultats.`;

      return {
        activeTools: [],
        messages: [...messagesSansTracesOutil, { role: "user" as const, content: consigne }],
      };
    },
    // Log serveur pour toute erreur pendant la génération (au cas où, même hors quota)
    onError: ({ error }) => {
      console.error("Erreur pendant la génération de la réponse IA :", error);
    },
    // Une fois le flux terminé, on enregistre la réponse. Pour un jeu à glossaire, c'est la
    // traduction française (étape 2) qui est sauvegardée, pas ce texte anglais intermédiaire.
    onFinish: async ({ text, finishReason, steps }) => {
      console.log("Chat terminé :", { finishReason, steps: steps.length, longueurTexte: text.length });
      if (!glossaire) {
        await addMessage(conversation.id, "assistant", text);
      }
    },
  });

  // Jeu sans glossaire : on stream directement la réponse (déjà en français)
  if (!glossaire) {
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: reponse.stream,
        // Attache l'id de conversation au message, pour que le client puisse le récupérer et le renvoyer ensuite
        messageMetadata: ({ part }) => {
          if (part.type === "start") return { conversationId: conversation.id };
        },
        // Erreur en plein streaming (Groq/Tavily tombe après le début) -> flux arrêté proprement,
        // le client reçoit ce code générique, jamais le détail technique brut (cahier des charges 13.1)
        onError: () => "technical_error",
      }),
    });
  }

  // Jeu avec glossaire : on attend la réponse anglaise complète (étape 1), puis on la traduit (étape 2).
  // C'est ce qui explique le temps de première réponse plus long : rien n'est streamé avant la traduction.
  let texteAnglais: string;
  try {
    texteAnglais = await reponse.text;
  } catch {
    return Response.json({ error: "technical_error" }, { status: 503 });
  }
  // Réponse vide (ex : Groq a refusé la requête, erreur avalée par onError) -> on ne traduit rien
  if (!texteAnglais.trim()) {
    return Response.json({ error: "technical_error" }, { status: 503 });
  }

  // On n'injecte dans le prompt de traduction que les noms du glossaire réellement présents dans la réponse
  const matches = findGlossaryMatches(texteAnglais, glossaire);
  console.log("Traduction :", { longueurEN: texteAnglais.length, termesGlossaire: matches.length });

  // streamTranslation se rabat sur le texte anglais si la traduction échoue -> onSauvegarde reçoit
  // le texte finalement affiché (français ou anglais), c'est lui qu'on enregistre en base.
  const traduction = await streamTranslation({
    system: buildTranslationPrompt(matches),
    texteAnglais,
    onSauvegarde: async (texte) => {
      await addMessage(conversation.id, "assistant", texte);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: traduction,
      messageMetadata: ({ part }) => {
        if (part.type === "start") return { conversationId: conversation.id };
      },
      onError: () => "technical_error",
    }),
  });
}