import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import type { TextStreamPart, ToolSet } from "ai";

// Modèle principal pour générer la réponse (étape 1). Plus de fallback : si Groq refuse la requête
// (ex. quota), l'erreur remonte au controller qui renvoie un message technique générique.
export const ANSWER_MODEL = groq("openai/gpt-oss-120b");

// Étape 2 du pipeline glossaire : la traduction tourne sur gpt-oss-20b, dont le quota est
// séparé de gpt-oss-120b (étape 1) — les deux étapes ne se disputent donc pas le même bucket.
const TRANSLATION_MODEL = groq("openai/gpt-oss-20b");

// Traduit un texte anglais en français (étape 2) et renvoie le flux streamé, prêt pour toUIMessageStream.
// Si gpt-oss-20b refuse la requête avant le premier token (ex. quota), on se rabat sur la réponse
// anglaise déjà obtenue plutôt que de ne rien montrer. onSauvegarde reçoit le texte finalement
// affiché (français si la traduction réussit, anglais sinon) pour l'enregistrer en base.
export async function streamTranslation({
  system,
  texteAnglais,
  onSauvegarde,
}: {
  system: string;
  texteAnglais: string;
    onSauvegarde: (texte: string) => void | Promise<void>;
}) {
  const traduction = streamText({
    model: TRANSLATION_MODEL,
    system,
    prompt: texteAnglais,
    onFinish: ({ text }) => onSauvegarde(text),
  });

  const iterateur = traduction.stream[Symbol.asyncIterator]();
  try {
    // On lit le tout premier morceau : seul moyen de savoir si Groq a accepté la requête de traduction
    const premier = await iterateur.next();
    return rebuildStream(premier, iterateur);
  } catch (error) {
    console.error("Traduction indisponible (quota gpt-oss-20b ?), repli sur la réponse anglaise.", error);
    await onSauvegarde(texteAnglais);
    return texteVersFlux(texteAnglais);
  }
}

// Remet en tête du flux le premier morceau qu'on a dû lire pour vérifier qu'il n'y avait pas d'erreur
function rebuildStream<T>(premier: IteratorResult<T>, reste: AsyncIterator<T>) {
  return new ReadableStream<T>({
    async start(controller) {
      if (!premier.done) controller.enqueue(premier.value);
      while (true) {
        const suivant = await reste.next();
        if (suivant.done) break;
        controller.enqueue(suivant.value);
      }
      controller.close();
    },
  });
}

// Fabrique un flux minimal à partir d'une chaîne (repli anglais) : on imite les morceaux qu'émettrait
// streamText (start, texte, finish) pour que toUIMessageStream les traite comme une réponse normale.
function texteVersFlux(texte: string): ReadableStream<TextStreamPart<ToolSet>> {
  const id = "fallback-en";
  // Cast nécessaire : le morceau "finish" attend un objet usage complet qu'on n'a pas ici et dont
  // toUIMessageStream ne se sert pas pour l'affichage — on fournit juste le minimum utile.
  const morceaux = [
    { type: "start" },
    { type: "text-start", id },
    { type: "text-delta", id, text: texte },
    { type: "text-end", id },
    { type: "finish", finishReason: "stop", rawFinishReason: "stop", totalUsage: {} },
  ] as unknown as TextStreamPart<ToolSet>[];

  return new ReadableStream<TextStreamPart<ToolSet>>({
    start(controller) {
      for (const morceau of morceaux) controller.enqueue(morceau);
      controller.close();
    },
  });
}