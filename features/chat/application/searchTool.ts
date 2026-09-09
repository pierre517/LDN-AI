import { tool } from "ai";
import { z } from "zod";
import { searchGameSources } from "@/features/chat/infrastructure/tavilyClient";
import { getCachedResults, saveCachedResults } from "@/features/chat/infrastructure/cacheClient";

type Params = { jeuId: string; sources: string[]; question: string };

// Fabrique l'outil pour une conversation donnée : jeuId/sources/question dépendent de la requête
// en cours, on ne peut donc pas les coder en dur dans un objet tool() statique.
export function createSearchGameWikiTool({ jeuId, sources, question }: Params) {
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
      // Clé de cache = question d'origine de l'utilisateur (stable d'une fois sur l'autre),
      // pas la reformulation du modèle (qui change à chaque appel -> cache quasi jamais réutilisé)
      const cache = await getCachedResults(jeuId, question);
      if (cache) return { resultats: cache };

      try {
        const resultats = await searchGameSources(query, sources);
        await saveCachedResults(jeuId, question, resultats);
        return { resultats };
      } catch {
        // Tavily indisponible malgré le retry interne -> pas de plantage du flux en cours (LDN-78 gère le
        // cas mid-stream) : le modèle répond avec ce qu'il a plutôt que d'échouer totalement
        return { resultats: [], erreur: "recherche indisponible" };
      }
    },
  });
}