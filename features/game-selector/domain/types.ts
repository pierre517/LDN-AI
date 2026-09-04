export type Game = {
  id: string;
  nom: string;
  rawgId: number;
  plateformes: string[];
  // Domaines communautaires autorisés pour la recherche Tavily de ce jeu (LDN-67)
  sources: string[];
  statut: "actif" | "inactif";
};

// Un Game enrichi avec les infos RAWG à afficher (image, studio, année) — utilisé uniquement côté UI
export type GameWithDetails = Game & {
  image: string | null;
  studio: string | null;
  annee: number | null;
};