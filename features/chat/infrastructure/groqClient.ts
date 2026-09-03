import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";

// gpt-oss-120b : seul modèle gratuit chez Groq qui supporte les tools personnalisés
// (compound/compound-mini exclus : ils ne supportent que leurs propres outils intégrés)
const MODEL = groq("openai/gpt-oss-120b");

// Envoie l'historique de messages au modèle et renvoie la réponse en streaming
export function streamChatResponse(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  return streamText({
    model: MODEL,
    messages,
  });
}