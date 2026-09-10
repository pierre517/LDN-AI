import { tavily } from "@tavily/core";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const RETRY_DELAY_MS = 500;
// Résultats volontairement compacts : ils sont réinjectés dans le contexte Groq (plafond 8K tokens/minute)
const MAX_RESULTATS = 5;
const MAX_CONTENU_CHARS = 1200;

export type TavilySearchResult = {
  titre: string;
  url: string;
  contenu: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Recherche restreinte aux domaines communautaires du jeu actif (includeDomains = whitelist stricte).
// Tavily peut être injoignable (panne réseau) -> une seule nouvelle tentative après un court délai.
export async function searchGameSources(query: string, sources: string[]): Promise<TavilySearchResult[]> {
  try {
    return await callTavily(query, sources);
  } catch (firstError) {
    console.error("Erreur technique (tavily-search), nouvelle tentative :", firstError);
    await wait(RETRY_DELAY_MS);
    return await callTavily(query, sources);
  }
}

async function callTavily(query: string, sources: string[]): Promise<TavilySearchResult[]> {
  const response = await client.search(query, {
    includeDomains: sources,
    maxResults: MAX_RESULTATS,
  });

  // On ne garde que ce dont le modèle a besoin, pas toute la réponse brute de Tavily
  return response.results.map((result) => ({
    titre: result.title,
    url: result.url,
    contenu: result.content.slice(0, MAX_CONTENU_CHARS),
  }));
}