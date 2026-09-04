import { tool } from "ai";
import { z } from "zod";
import { saveGlossaryTerm } from "@/features/chat/infrastructure/glossaryClient";

type Params = { jeuId: string };

// Fabrique l'outil pour une conversation donnée (jeuId dépend du jeu actif)
export function createSaveTranslationsTool({ jeuId }: Params) {
  return tool({
    description:
      "Enregistre dans le glossaire les traductions françaises que tu as retenues avec certitude pour des noms propres. " +
      "N'appelle JAMAIS cet outil pour un nom resté en anglais faute de source fiable.",
    inputSchema: z.object({
      traductions: z
        .array(z.object({ termeAnglais: z.string(), termeFrancais: z.string() }))
        .describe("Les paires nom anglais / nom français retenues, pour réutilisation par les prochains utilisateurs."),
    }),
    execute: async ({ traductions }) => {
      // Sauvegarde en parallèle : un échec sur un terme ne doit pas empêcher les autres
      await Promise.all(traductions.map((t) => saveGlossaryTerm(jeuId, t.termeAnglais, t.termeFrancais)));
      return { enregistre: traductions.length };
    },
  });
}
