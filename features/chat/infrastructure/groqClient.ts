import { groq } from "@ai-sdk/groq";
import type { AsyncIterableStream, TextStreamPart, ToolSet } from "ai";

// gpt-oss-20b sert de modèle de secours : mêmes capacités (tools compris) que gpt-oss-120b,
// mais avec un quota Groq séparé — utile si gpt-oss-120b est à quota au moment de la requête.
const PRIMARY_MODEL = groq("openai/gpt-oss-120b");
const FALLBACK_MODEL = groq("openai/gpt-oss-20b");

// Le controller construit lui-même l'appel streamText (system, messages, tools...),
// on lui fournit juste le modèle à utiliser pour chaque tentative.
type BuildCall<TOOLS extends ToolSet> = (
  model: typeof PRIMARY_MODEL,
) => { stream: AsyncIterableStream<TextStreamPart<TOOLS>> };

// Tente l'appel avec gpt-oss-120b, et bascule automatiquement sur gpt-oss-20b si Groq
// refuse la requête (ex : quota dépassé) avant d'avoir streamé la moindre réponse.
export async function streamChatWithFallback<TOOLS extends ToolSet>(buildCall: BuildCall<TOOLS>) {
  const primary = buildCall(PRIMARY_MODEL);
  const iterator = primary.stream[Symbol.asyncIterator]();

  try {
    // Seul moyen de savoir si Groq a accepté la requête : lire le tout premier morceau de la réponse.
    const firstChunk = await iterator.next();
    return rebuildStream(firstChunk, iterator);
  } catch (error) {
    console.error("Groq : gpt-oss-120b indisponible (quota atteint ?), bascule sur gpt-oss-20b.", error);
    return buildCall(FALLBACK_MODEL).stream;
  }
}

// Remet en tête du flux le premier morceau qu'on a dû lire pour vérifier qu'il n'y avait pas d'erreur
function rebuildStream<T>(firstChunk: IteratorResult<T>, rest: AsyncIterator<T>) {
  return new ReadableStream<T>({
    async start(controller) {
      if (!firstChunk.done) controller.enqueue(firstChunk.value);
      while (true) {
        const next = await rest.next();
        if (next.done) break;
        controller.enqueue(next.value);
      }
      controller.close();
    },
  });
}