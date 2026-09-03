import { getGames } from "@/features/game-selector/infrastructure/gamesConfig";

// Vérifie qu'un jeu_id reçu (ex. dans une requête API) correspond à un jeu connu et actif.
// Retourne null si invalide -> à l'appelant de rejeter la requête avec une erreur claire.
export function validateGameId(jeuId: string) {
  const games = getGames();
  const game = games.find((g) => g.id === jeuId && g.statut === "actif");

  return game ?? null;
}