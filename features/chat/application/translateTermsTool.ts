import { tool } from "ai";
import { z } from "zod";
import { getKnownTranslations } from "@/features/chat/infrastructure/glossaryClient";
import { searchGameSources } from "@/features/chat/infrastructure/tavilyClient";

type Params = { jeuId: string; gameName: string };

// Fabrique l'outil pour une conversation donnée (jeuId/gameName dépendent du jeu actif)
export function createTranslateTermsTool({ jeuId, gameName }: Params) {
  return tool({
    description:
      "Vérifie le nom officiel en version française des noms propres (ex: objets, personnages, lieux, capacités...) " +
      "identifiés dans les résultats de recherche — ce n'est pas une traduction littérale, la version française peut être " +
      "complètement différente de l'anglais. Pour les noms encore inconnus, renvoie des résultats de recherche bruts à analyser : " +
      "décide ensuite toi-même le nom français officiel à partir de ces résultats, ou garde le nom anglais si aucune source fiable " +
      "n'en donne un. N'appelle cet outil qu'une seule fois par réponse, avec tous les noms d'un coup.",
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

      // Étape 2 : une seule recherche groupée pour tous les noms inconnus (jamais un appel par nom).
      // Recherche volontairement non restreinte aux sources du jeu (contrairement à searchGameWiki) :
      // le nom français officiel n'apparaît presque jamais sur les wikis/forums anglais configurés.
      // Le nom du jeu est ajouté à la requête pour compenser l'absence de filtre par domaine.
      const requete = `${gameName} nom français officiel : ${inconnus.join(", ")}`;
      const resultatsRecherche = await searchGameSources(requete, []);

      return { traductionsConnues: connus, resultatsRecherche };
    },
  });
}
