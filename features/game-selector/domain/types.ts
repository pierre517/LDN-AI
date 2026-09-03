export type Game = {
  id: string;
  nom: string;
  rawgId: number;
  plateformes: string[];
  statut: "actif" | "inactif";
};