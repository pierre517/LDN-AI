import { getGames } from "@/features/game-selector/infrastructure/gamesConfig";
import { getGameDetails } from "@/features/game-selector/infrastructure/rawgClient";
import { GameSelectorForm } from "./GameSelectorForm";

// Composant serveur : lit le YAML + appelle RAWG (clé API RAWG_API_KEY, doit rester côté serveur)
export async function GameSelector() {
  const games = await Promise.all(
    getGames()
      .filter((game) => game.statut === "actif")
      .map(async (game) => ({
        ...game,
        ...(await getGameDetails(game.rawgId)),
      }))
  );

  return <GameSelectorForm games={games} />;
}