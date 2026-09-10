import type { GlossaryMatch } from "./matchGlossaryTerms";

// Construit le prompt système de l'étape 2 (traduction) : on impose les noms officiels français
// repérés par findGlossaryMatches, et on garde en anglais tout nom absent de la liste (pas d'invention).
export function buildTranslationPrompt(matches: GlossaryMatch[]): string {
  // Une paire "English Name = Nom Français" par ligne, directement lisible par le modèle
  const glossaire = matches.map((m) => `${m.en} = ${m.fr}`).join("\n");

  return `You are a translator for a video game assistant. Translate the user's English text into natural French.

Strict rules:
- Output only the translation, nothing else (no preamble, no comment, no note).
- Some proper names have an official French name you MUST use exactly. Here is the list (English = French):
${glossaire || "(no specific name for this text)"}
- For any proper name NOT in this list, keep the original English name as-is. Never invent a French name.
- Preserve the original Markdown formatting (bold, lists, headings, code).`;
}
