import { tool } from "ai";
import { z } from "zod";

// Outil que le modèle peut appeler pour demander une recherche —
// c'est toujours notre code qui l'exécute, jamais le modèle lui-même (section 10.1 du cahier des charges)
export const searchGameWikiTool = tool({
  description:
    "Recherche des informations sur le jeu dans les sources communautaires (wikis, forums) pour répondre à la question de l'utilisateur.",
  inputSchema: z.object({
    query: z.string().describe("La requête de recherche optimisée, reformulée à partir de la question de l'utilisateur."),
  }),
  execute: async ({ query }) => {
    // TODO (Epic 6, LDN-67) : remplacer par le vrai appel à infrastructure/tavilyClient.ts,
    // restreint aux sources du jeu actif — pas encore construit à ce stade du projet.
    return { resultats: `Recherche non encore implémentée pour : "${query}"` };
  },
});