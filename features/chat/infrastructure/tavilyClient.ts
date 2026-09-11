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
    // "advanced" coûte 2 crédits au lieu de 1, mais "basic" rate les bonnes pages sur les gros wikis
    searchDepth: "advanced",
    maxResults: MAX_RESULTATS,
  });

  // Tavily peut glisser des pages hors liste (constaté en test) et son mode strict refuse les chemins
  // (ex. "fandom.com/fr") -> on applique nous-mêmes la whitelist sur les URL renvoyées
  return response.results
    .filter((result) => estDansLesSources(result.url, sources))
    // On ne garde que ce dont le modèle a besoin, pas toute la réponse brute de Tavily
    .map((result) => ({
      titre: result.title,
      url: result.url,
      contenu: result.content.slice(0, MAX_CONTENU_CHARS),
    }));
}

// Une URL est acceptée si, une fois débarrassée de "https://" et "www.", elle commence par l'une des sources
function estDansLesSources(url: string, sources: string[]): boolean {
  const urlNormalisee = url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  return sources.some((source) => urlNormalisee.startsWith(source.toLowerCase()));
}