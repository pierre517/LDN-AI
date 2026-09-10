import { getGames } from "@/features/game-selector/infrastructure/gamesConfig";
import { getGameDetails } from "@/features/game-selector/infrastructure/rawgClient";
import { GameSelectorForm } from "./GameSelectorForm";

// Composant serveur : lit le YAML + appelle RAWG (clé API RAWG_API_KEY, doit rester côté serveur)
export async function GameSelector() {
  const games = await Promise.all(
    getGames()
      .filter((game) => game.statut === "actif")
      .map(async (game) => {
        // RAWG isolé par jeu : si l'appel échoue (rawg_id faux, RAWG injoignable),
        // on affiche quand même le jeu sans jaquette plutôt que de casser toute la page
        try {
          return { ...game, ...(await getGameDetails(game.rawgId)) };
        } catch (error) {
          console.error(`RAWG indisponible pour ${game.id} (rawg_id ${game.rawgId}) :`, error);
          return { ...game, image: null, studio: null, annee: null };
        }
      })
  );

  return <GameSelectorForm games={games} />;
}