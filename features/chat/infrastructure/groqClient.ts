import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";

// Modèle principal pour générer la réponse (étape 1). Plus de fallback : si Groq refuse la requête
// (ex. quota), l'erreur remonte au controller qui renvoie un message technique générique.
export const ANSWER_MODEL = groq("openai/gpt-oss-120b");

// Étape 2 du pipeline glossaire : la traduction tourne sur gpt-oss-20b, dont le quota est
// séparé de gpt-oss-120b (étape 1) — les deux étapes ne se disputent donc pas le même bucket.
const TRANSLATION_MODEL = groq("openai/gpt-oss-20b");

// Traduit un texte anglais en français (étape 2) et renvoie le flux streamé, prêt pour toUIMessageStream.
// onFinish reçoit la traduction complète, pour la sauvegarder en base côté controller.
export function streamTranslation({
  system,
  texteAnglais,
  onFinish,
}: {
  system: string;
  texteAnglais: string;
  onFinish: (texte: string) => void | Promise<void>;
}) {
  return streamText({
    model: TRANSLATION_MODEL,
    system,
    prompt: texteAnglais,
    onFinish: ({ text }) => onFinish(text),
  }).stream;
}