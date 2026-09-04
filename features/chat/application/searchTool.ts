import { tool } from "ai";
import { z } from "zod";
import { searchGameSources } from "@/features/chat/infrastructure/tavilyClient";
import { getCachedResults, saveCachedResults } from "@/features/chat/infrastructure/cacheClient";

type Params = { jeuId: string; sources: string[] };

// Fabrique l'outil pour une conversation donnée : jeuId/sources dépendent du jeu actif,
// on ne peut donc pas les coder en dur dans un objet tool() statique.
export function createSearchGameWikiTool({ jeuId, sources }: Params) {
  return tool({
    description:
      "Recherche des informations sur le jeu dans les sources communautaires (wikis, forums) pour répondre à la question de l'utilisateur.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("La requête de recherche optimisée, reformulée à partir de la question de l'utilisateur."),
    }),
    // C'est toujours notre code qui exécute la recherche, jamais le modèle lui-même (section 10.1 du cahier des charges)
    execute: async ({ query }) => {
      const cache = await getCachedResults(jeuId, query);
      if (cache) return { resultats: cache };

      const resultats = await searchGameSources(query, sources);
      await saveCachedResults(jeuId, query, resultats);
      return { resultats };
    },
  });
}