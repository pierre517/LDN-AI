import { tool } from "ai";
import { z } from "zod";
import { searchGameSources } from "@/features/chat/infrastructure/tavilyClient";
import { getCachedResults, saveCachedResults } from "@/features/chat/infrastructure/cacheClient";

type Params = { jeuId: string; jeuNom: string; sources: string[]; question: string };

// Fabrique l'outil pour une conversation donnée : jeuId/sources/question dépendent de la requête
// en cours, on ne peut donc pas les coder en dur dans un objet tool() statique.
export function createSearchGameWikiTool({ jeuId, jeuNom, sources, question }: Params) {
  // Une recherche interroge déjà toutes les sources d'un coup : une seule suffit par question.
  // Sans ce verrou, le modèle peut relancer l'outil en boucle et faire exploser les tokens Groq.
  let rechercheEffectuee = false;
  let nbResultats = 0;

  return tool({
    description:
      "Recherche des informations sur le jeu dans les sources communautaires (wikis, forums) pour répondre à la question de l'utilisateur.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "La requête de recherche optimisée, reformulée à partir de la question de l'utilisateur. Rédigée en français (les sources sont francophones), en incluant le nom du jeu.",
        ),
    }),
    // C'est toujours notre code qui exécute la recherche, jamais le modèle lui-même (section 10.1 du cahier des charges)
    execute: async ({ query }) => {
      if (rechercheEffectuee) {
        // Message adapté selon ce que la recherche avait donné, pour ne pas promettre des résultats inexistants.
        // Jamais d'invitation à puiser dans son propre savoir : les réponses viennent des sources, point.
        return nbResultats > 0
          ? { info: "Recherche déjà effectuée : rédige ta réponse avec les résultats déjà fournis." }
          : {
            info: "La recherche n'a rien donné : indique simplement à l'utilisateur que tu n'as pas trouvé l'information dans les sources, sans répondre avec tes propres connaissances.",
          };
      }
      rechercheEffectuee = true;

      // Garde-fou : certaines sources couvrent plusieurs jeux (ex. jeuxvideo.com), le nom du jeu
      // dans la requête est notre seule protection contre les résultats d'un autre jeu
      const queryAvecJeu = query.toLowerCase().includes(jeuNom.toLowerCase()) ? query : `${jeuNom} ${query}`;

      // Clé de cache = question d'origine de l'utilisateur (stable d'une fois sur l'autre),
      // pas la reformulation du modèle (qui change à chaque appel -> cache quasi jamais réutilisé)
      const cache = await getCachedResults(jeuId, question);
      if (cache) {
        nbResultats = cache.length;
        console.log(`searchGameWiki: ${cache.length} résultat(s) depuis le cache pour "${queryAvecJeu}"`);
        return { resultats: cache };
      }

      try {
        const resultats = await searchGameSources(queryAvecJeu, sources);
        await saveCachedResults(jeuId, question, resultats);
        nbResultats = resultats.length;
        console.log(`searchGameWiki: ${resultats.length} résultat(s) depuis Tavily pour "${queryAvecJeu}"`);
        return { resultats };
      } catch {
        // Tavily indisponible malgré le retry interne -> pas de plantage du flux en cours (LDN-78 gère le
        // cas mid-stream) : le modèle répond avec ce qu'il a plutôt que d'échouer totalement
        return { resultats: [], erreur: "recherche indisponible" };
      }
    },
  });
}