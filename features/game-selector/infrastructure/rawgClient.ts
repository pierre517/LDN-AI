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