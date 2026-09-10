import { readFileSync } from "fs";
import path from "path";
import type { Game } from "@/features/game-selector/domain/types";

// Un glossaire = paires "nom anglais" -> "nom français officiel" (ex. "Erdtree's Favor": "Faveur de l'Arbre-Monde")
export type Glossary = Record<string, string>;

// Cache mémoire : le fichier (~432 Ko pour Elden Ring) n'est lu et parsé qu'une seule fois
// par process, pas à chaque question du chat. Il ne change qu'au déploiement.
const glossaryCache = new Map<string, Glossary>();

// Renvoie le glossaire EN->FR du jeu, ou null si le jeu n'en a pas (= pipeline classique sans traduction)
export function getGlossary(game: Game): Glossary | null {
  if (!game.glossaire) {
    return null;
  }

  const cached = glossaryCache.get(game.glossaire);
  if (cached) {
    return cached;
  }

  // path.basename : on ne garde que le nom de fichier, impossible de sortir du dossier config/glossaires
  const fileName = path.basename(game.glossaire);
  const filePath = path.join(process.cwd(), "config", "glossaires", fileName);

  // Pas de try/catch : un fichier référencé dans games.yaml mais absent/invalide est une
  // erreur de config à corriger, mieux vaut une erreur explicite qu'un glossaire vide silencieux
  const fileContent = readFileSync(filePath, "utf8");
  const glossary = JSON.parse(fileContent) as Glossary;

  glossaryCache.set(game.glossaire, glossary);
  return glossary;
}
