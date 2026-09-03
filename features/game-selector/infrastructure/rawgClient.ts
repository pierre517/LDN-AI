const RAWG_BASE_URL = "https://api.rawg.io/api";

// Cherche des jeux par nom sur RAWG, pour l'autocomplétion du formulaire (LDN-52)
export async function searchGames(query: string) {
  const url = `${RAWG_BASE_URL}/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Impossible de contacter RAWG");
  }

  const data = await response.json();
  return data.results as { id: number; name: string; background_image: string | null }[];
}

// Récupère les détails d'un jeu précis par son rawg_id (image, studio, année) — pas une recherche, un jeu ciblé
export async function getGameDetails(rawgId: number) {
  const url = `${RAWG_BASE_URL}/games/${rawgId}?key=${process.env.RAWG_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Impossible de récupérer les détails du jeu sur RAWG");
  }

  const data = await response.json();

  return {
    image: data.background_image as string | null,
    studio: (data.developers?.[0]?.name as string | undefined) ?? null,
    annee: data.released ? new Date(data.released).getFullYear() : null,
  };
}