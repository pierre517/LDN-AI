import { tool } from "ai";
import { z } from "zod";
import { getKnownTranslations } from "@/features/chat/infrastructure/glossaryClient";
import { searchGameSources } from "@/features/chat/infrastructure/tavilyClient";

type Params = { jeuId: string; sources: string[] };

// Fabrique l'outil pour une conversation donnée (jeuId/sources dépendent du jeu actif)
export function createTranslateTermsTool({ jeuId, sources }: Params) {
  return tool({
    description:
      "Vérifie la traduction française des noms propres (objets, boss, lieux, PNJ) identifiés dans les résultats de recherche. " +
      "Pour les noms encore inconnus, renvoie des résultats de recherche bruts à analyser — décide ensuite toi-même la traduction, " +
      "ou garde le nom anglais si aucune source fiable n'en donne une. N'appelle cet outil qu'une seule fois par réponse, avec tous les noms d'un coup.",
    inputSchema: z.object({
      termesAnglais: z.array(z.string()).describe("Les noms propres en anglais identifiés dans les résultats de recherche."),
    }),
    execute: async ({ termesAnglais }) => {
      // Étape 1 : réutilise le glossaire existant, aucune recherche pour les noms déjà connus
      const connus = await getKnownTranslations(jeuId, termesAnglais);
      const inconnus = termesAnglais.filter((terme) => !connus[terme]);

      if (inconnus.length === 0) {
        return { traductionsConnues: connus, resultatsRecherche: null };
      }

      // Étape 2 : une seule recherche groupée pour tous les noms inconnus (jamais un appel par nom)
      const requete = `traduction française officielle : ${inconnus.join(", ")}`;
      const resultatsRecherche = await searchGameSources(requete, sources);

      return { traductionsConnues: connus, resultatsRecherche };
    },
  });
}
