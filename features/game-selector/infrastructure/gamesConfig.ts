import { readFileSync } from "fs";
import { load } from "js-yaml";
import path from "path";
import type { Game } from "@/features/game-selector/domain/types";

// Forme brute du fichier YAML (snake_case, telle qu'écrite dans config/games.yaml)
type GameConfigEntry = {
  id: string;
  rawg_id: number;
  nom: string;
  plateformes: string[];
  sources: string[];
  statut: string;
};

// Lit config/games.yaml et ne garde que les champs utiles au sélecteur de jeu (domain/types.ts)
export function getGames(): Game[] {
  const filePath = path.join(process.cwd(), "config", "games.yaml");
  const fileContent = readFileSync(filePath, "utf8");
  const parsed = load(fileContent) as { games: GameConfigEntry[] };

  return parsed.games.map((game) => ({
    id: game.id,
    nom: game.nom,
    rawgId: game.rawg_id, // conversion snake_case (YAML) -> camelCase (notre domaine)
    plateformes: game.plateformes,
    statut: game.statut as "actif" | "inactif",
  }));
}