import { tool } from "ai";
import { z } from "zod";
import { searchGameSources } from "@/features/chat/infrastructure/tavilyClient";
import { getCachedResults, saveCachedResults } from "@/features/chat/infrastructure/cacheClient";

type Params = { jeuId: string; jeuNom: string; sources: string[]; question: string; langue: "fr" | "en" };

// Mots trop courts pour identifier un jeu à eux seuls ("The", "V", "Ring"...)
const LONGUEUR_MIN_MOT = 5;

// Le modèle écrit souvent le nom court ("Skyrim") plutôt que le nom complet ("The Elder Scrolls V: Skyrim") :
// on considère le jeu présent dès qu'un mot significatif de son nom apparaît, pour ne pas le préfixer en double.
function contientNomDuJeu(query: string, jeuNom: string): boolean {
  const motsSignificatifs = jeuNom
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((mot) => mot.length >= LONGUEUR_MIN_MOT);

  // Aucun mot assez long (nom de jeu très court) -> on retombe sur la comparaison du nom complet
  if (motsSignificatifs.length === 0) {
    return query.toLowerCase().includes(jeuNom.toLowerCase());
  }

  const motsQuery = query.toLowerCase().split(/[^\p{L}\p{N}]+/u);
  return motsSignificatifs.some((mot) => motsQuery.includes(mot));
}

// Fabrique l'outil pour une conversation donnée : jeuId/sources/question dépendent de la requête
// en cours, on ne peut donc pas les coder en dur dans un objet tool() statique.
export function createSearchGameWikiTool({ jeuId, jeuNom, sources, question, langue }: Params) {
  // Une recherche interroge déjà toutes les sources d'un coup : une seule suffit par question.
  // Sans ce verrou, le modèle peut relancer l'outil en boucle et faire exploser les tokens Groq.
  let rechercheEffectuee = false;
  let nbResultats = 0;

  // Les sources d'un jeu à glossaire sont anglaises -> la requête doit l'être aussi pour bien matcher.
  // Des mots-clés façon titre de page de wiki ressortent bien mieux qu'une phrase complète.
  const consigneQuery =
    langue === "en"
      ? "Search keywords derived from the user's question, like a wiki page title (e.g. 'Skyrim races starting skills'), not a full sentence. Written in English (the sources are English-language), including the game name."
      : "Mots-clés de recherche tirés de la question de l'utilisateur, façon titre de page de wiki (ex. « Skyrim races compétences de départ »), pas une phrase complète. Rédigés en français (les sources sont francophones), en incluant le nom du jeu.";

  return tool({
    description:
      "Recherche des informations sur le jeu dans les sources communautaires (wikis, forums) pour répondre à la question de l'utilisateur.",
    inputSchema: z.object({
      query: z.string().describe(consigneQuery),
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
      const queryAvecJeu = contientNomDuJeu(query, jeuNom) ? query : `${jeuNom} ${query}`;

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