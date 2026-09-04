import { tavily } from "@tavily/core";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

export type TavilySearchResult = {
  titre: string;
  url: string;
  contenu: string;
};

// Recherche restreinte aux domaines communautaires du jeu actif (includeDomains = whitelist stricte)
export async function searchGameSources(query: string, sources: string[]): Promise<TavilySearchResult[]> {
  const response = await client.search(query, {
    includeDomains: sources,
    maxResults: 5,
  });

  // On ne garde que ce dont le modèle a besoin, pas toute la réponse brute de Tavily
  return response.results.map((result) => ({
    titre: result.title,
    url: result.url,
    contenu: result.content,
  }));
}